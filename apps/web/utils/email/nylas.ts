import { randomUUID } from "node:crypto";
import { env } from "@/env";
import {
  extractEmailAddress,
  formatEmailWithName,
  splitRecipientList,
} from "@/utils/email";
import type {
  EmailProvider,
  EmailThread,
  EmailLabel,
  EmailFolderCount,
} from "@/utils/email/types";
import {
  VinboxNylasClient,
  type NylasAddress,
  type NylasFolder,
  type NylasMessage,
  type NylasThread,
} from "@/utils/nylas/vinbox-client";
import prisma from "@/utils/prisma";
import type { ParsedMessage } from "@/utils/types";
import type { SendEmailBody } from "@/utils/types/mail";

export async function createNylasProvider(
  emailAccountId: string,
): Promise<EmailProvider> {
  const account = await prisma.emailAccount.findUnique({
    where: { id: emailAccountId },
    select: {
      email: true,
      account: {
        select: {
          provider: true,
          providerAccountId: true,
          disconnectedAt: true,
        },
      },
    },
  });
  if (
    account?.account.provider !== "nylas" ||
    account.account.disconnectedAt ||
    !env.NYLAS_API_KEY
  ) {
    throw new Error("Nylas account is unavailable");
  }
  const client = new VinboxNylasClient({
    apiKey: env.NYLAS_API_KEY,
    region: env.NYLAS_REGION,
  });
  const grantId = account.account.providerAccountId;
  const ownerEmail = account.email;

  const core = {
    name: "nylas" as const,
    localMailSyncStrategy: "account-history" as const,
    toJSON: () => ({ name: "nylas", type: "imap" }),
    getAccessToken: () => {
      throw new Error("Nylas API credentials are not available to callers");
    },
    async getLabels(): Promise<EmailLabel[]> {
      const { data } = await client.listFolders(grantId);
      return data.map((folder) => ({
        id: folder.id,
        name: folder.name,
        type: folder.attributes?.length ? "system" : "user",
      }));
    },
    async getLabelById(labelId: string) {
      return (
        (await core.getLabels()).find((label) => label.id === labelId) ?? null
      );
    },
    async getLabelByName(name: string) {
      return (
        (await core.getLabels()).find(
          (label) => label.name.toLowerCase() === name.toLowerCase(),
        ) ?? null
      );
    },
    async getFolders() {
      const { data } = await client.listFolders(grantId);
      return data.map((folder) => ({
        id: folder.id,
        displayName: folder.name,
        childFolders: [],
        childFolderCount: 0,
        totalItemCount: folder.total_count ?? 0,
        unreadItemCount: folder.unread_count ?? 0,
        systemType: folderSystemType(folder),
      }));
    },
    async getFolderCounts(): Promise<EmailFolderCount[]> {
      const { data } = await client.listFolders(grantId);
      return data.map((folder) => ({
        id: folder.id,
        name: folder.name,
        total: folder.total_count ?? 0,
        unread: folder.unread_count ?? 0,
        systemType: folderSystemType(folder),
      }));
    },
    async getInboxStats() {
      const { data } = await client.listFolders(grantId);
      const inbox = findSystemFolder(data, "INBOX");
      if (!inbox) throw new Error("IMAP inbox folder was not found");
      return { total: inbox.total_count ?? 0, unread: inbox.unread_count ?? 0 };
    },
    async createLabel(name: string) {
      const { data } = await client.createFolder(grantId, name);
      return { id: data.id, name: data.name, type: "user" };
    },
    async deleteLabel(labelId: string) {
      await client.deleteFolder(grantId, labelId);
    },
    async updateLabel(labelId: string, update: { name?: string }) {
      if (!update.name) throw new Error("Nylas IMAP requires a folder name");
      await client.renameFolder(grantId, labelId, update.name);
    },
    async renameFolder(folderId: string, name: string) {
      await client.renameFolder(grantId, folderId, name);
    },
    async deleteFolder(folderId: string) {
      await client.deleteFolder(grantId, folderId);
    },
    async getOrCreateFolderIdByName(folderName: string) {
      const existing = await core.getLabelByName(folderName);
      if (existing) return existing.id;
      return (await client.createFolder(grantId, folderName)).data.id;
    },
    async getThreadsWithQuery(
      options: Parameters<EmailProvider["getThreadsWithQuery"]>[0],
    ) {
      const type = options.query?.type;
      const folderId = await resolveFolderId(
        client,
        grantId,
        options.query?.folderId ??
          options.query?.labelIds?.[0] ??
          options.query?.labelId ??
          (type && !["all", "unread", "starred"].includes(type)
            ? type
            : undefined),
      );
      const { data, next_cursor } = await client.listThreads(grantId, {
        limit: options.maxResults,
        pageToken: options.pageToken,
        unread: options.query?.isUnread ?? (type === "unread" || undefined),
        starred: type === "starred" || undefined,
        folderId,
        query: options.query?.q ?? undefined,
      });
      return {
        threads: data.map(toEmailThread),
        nextPageToken: next_cursor,
      };
    },
    async searchThreads(
      options: Parameters<EmailProvider["searchThreads"]>[0],
    ) {
      const { data, next_cursor } = await client.listThreads(grantId, {
        limit: options.maxResults,
        pageToken: options.pageToken,
        query: options.query,
      });
      return { threads: data.map(toEmailThread), nextPageToken: next_cursor };
    },
    async getThread(threadId: string): Promise<EmailThread> {
      const { data } = await client.getThread(grantId, threadId);
      const ids = data.message_ids?.length
        ? data.message_ids
        : data.latest_draft_or_message
          ? [data.latest_draft_or_message.id]
          : [];
      const messages: NylasMessage[] = [];
      for (let index = 0; index < ids.length; index += 4) {
        const batch = await Promise.all(
          ids
            .slice(index, index + 4)
            .map(async (id) => (await client.getMessage(grantId, id)).data),
        );
        messages.push(...batch);
      }
      return {
        id: data.id,
        snippet: data.snippet ?? "",
        messages: messages
          .map(toParsedMessage)
          .sort((a, b) => a.date.localeCompare(b.date)),
      };
    },
    async getMessage(messageId: string) {
      return toParsedMessage(
        (await client.getMessage(grantId, messageId)).data,
      );
    },
    async getDraft(draftId: string) {
      return toParsedMessage((await client.getDraft(grantId, draftId)).data);
    },
    async getDrafts(options?: Parameters<EmailProvider["getDrafts"]>[0]) {
      return (await client.listDrafts(grantId, options?.maxResults)).data.map(
        toParsedMessage,
      );
    },
    async createDraft(params: Parameters<EmailProvider["createDraft"]>[0]) {
      if (params.forwardedMessageId) {
        throw new Error("Nylas IMAP does not support draft forwarding yet");
      }
      if (
        params.from &&
        extractEmailAddress(params.from).toLowerCase() !==
          ownerEmail.toLowerCase()
      ) {
        throw new Error("Sender does not belong to this mailbox");
      }
      const { data } = await client.createDraft(grantId, {
        to: parseAddresses(params.to),
        cc: params.cc ? parseAddresses(params.cc) : undefined,
        bcc: params.bcc ? parseAddresses(params.bcc) : undefined,
        subject: params.subject,
        body: params.messageHtml,
        reply_to_message_id: params.replyToMessageId,
      });
      return { id: data.id };
    },
    async updateDraft(
      draftId: string,
      params: Parameters<EmailProvider["updateDraft"]>[1],
    ) {
      if (
        params.from &&
        extractEmailAddress(params.from).toLowerCase() !==
          ownerEmail.toLowerCase()
      ) {
        throw new Error("Sender does not belong to this mailbox");
      }
      const existing = (await client.getDraft(grantId, draftId)).data;
      await client.updateDraft(grantId, draftId, {
        to: params.to !== undefined ? parseAddresses(params.to) : existing.to,
        cc:
          params.cc !== undefined
            ? parseOptionalAddresses(params.cc)
            : existing.cc,
        bcc:
          params.bcc !== undefined
            ? parseOptionalAddresses(params.bcc)
            : existing.bcc,
        subject: params.subject ?? existing.subject,
        body: params.messageHtml ?? existing.body,
      });
    },
    async deleteDraft(draftId: string) {
      await client.deleteDraft(grantId, draftId);
      return true;
    },
    async sendDraft(draftId: string) {
      const { data } = await client.sendDraft(grantId, draftId);
      return { messageId: data.id, threadId: data.thread_id };
    },
    async draftEmail(
      email: ParsedMessage,
      args: Parameters<EmailProvider["draftEmail"]>[1],
      userEmail: string,
    ) {
      if (userEmail.toLowerCase() !== ownerEmail.toLowerCase()) {
        throw new Error("Draft owner does not match this mailbox");
      }
      if (args.attachments?.length) {
        throw new Error("Nylas IMAP does not support AI draft attachments yet");
      }
      const { id } = await core.createDraft({
        to: args.to ?? email.headers["reply-to"] ?? email.headers.from,
        cc: args.cc,
        bcc: args.bcc,
        subject:
          args.subject ??
          (email.subject.startsWith("Re:")
            ? email.subject
            : `Re: ${email.subject}`),
        messageHtml: args.content,
        replyToMessageId: email.id,
      });
      return { draftId: id };
    },
    async getAttachmentStream(messageId: string, attachmentId: string) {
      return client.downloadAttachment(grantId, messageId, attachmentId);
    },
    async markMessagesReadState(messageIds: string[], read: boolean) {
      await Promise.all(
        messageIds.map((id) =>
          client.updateMessage(grantId, id, { unread: !read }),
        ),
      );
    },
    async markMessagesStarredState(messageIds: string[], starred: boolean) {
      await Promise.all(
        messageIds.map((id) => client.updateMessage(grantId, id, { starred })),
      );
    },
    async markReadThread(threadId: string, read: boolean) {
      await client.updateThread(grantId, threadId, { unread: !read });
    },
    async markRead(threadId: string) {
      await core.markReadThread(threadId, true);
    },
    async starMessage(messageId: string) {
      await client.updateMessage(grantId, messageId, { starred: true });
    },
    async archiveMessage(messageId: string) {
      const archive = await resolveFolderId(client, grantId, "archive");
      if (!archive) throw new Error("IMAP archive folder was not found");
      await client.updateMessage(grantId, messageId, { folders: [archive] });
    },
    async archiveMessages(messageIds: string[]) {
      await Promise.all(messageIds.map((id) => core.archiveMessage(id)));
    },
    async archiveThread(threadId: string, owner: string) {
      if (owner.toLowerCase() !== ownerEmail.toLowerCase()) {
        throw new Error("Mailbox owner does not match this account");
      }
      const archive = await resolveFolderId(client, grantId, "archive");
      if (!archive) throw new Error("IMAP archive folder was not found");
      await client.updateThread(grantId, threadId, { folders: [archive] });
    },
    async archiveThreadWithLabel(threadId: string, owner: string) {
      await core.archiveThread(threadId, owner);
    },
    async unarchiveMessages(messageIds: string[]) {
      const inbox = await resolveFolderId(client, grantId, "inbox");
      if (!inbox) throw new Error("IMAP inbox folder was not found");
      await Promise.all(
        messageIds.map((id) =>
          client.updateMessage(grantId, id, { folders: [inbox] }),
        ),
      );
    },
    async unarchiveThread(threadId: string) {
      const inbox = await resolveFolderId(client, grantId, "inbox");
      if (!inbox) throw new Error("IMAP inbox folder was not found");
      await client.updateThread(grantId, threadId, { folders: [inbox] });
    },
    async trashMessages(messageIds: string[]) {
      await Promise.all(
        messageIds.map((id) => client.deleteMessage(grantId, id)),
      );
    },
    async trashThread(threadId: string, owner: string) {
      if (owner.toLowerCase() !== ownerEmail.toLowerCase()) {
        throw new Error("Mailbox owner does not match this account");
      }
      await client.deleteThread(grantId, threadId);
    },
    async markSpam(threadId: string) {
      const spam = await resolveFolderId(client, grantId, "spam");
      if (!spam) throw new Error("IMAP spam folder was not found");
      await client.updateThread(grantId, threadId, { folders: [spam] });
    },
    async markNotSpam(threadId: string) {
      await core.unarchiveThread(threadId);
    },
    async moveThreadToFolder(
      threadId: string,
      owner: string,
      folderName: string,
    ) {
      if (owner.toLowerCase() !== ownerEmail.toLowerCase()) {
        throw new Error("Mailbox owner does not match this account");
      }
      const folderId = await core.getOrCreateFolderIdByName(folderName);
      await client.updateThread(grantId, threadId, { folders: [folderId] });
    },
    async sendEmailWithHtml(body: SendEmailBody) {
      if (body.providerDraftId) {
        throw new Error("Nylas IMAP cannot send a composer draft by ID yet");
      }
      if (
        body.from &&
        extractEmailAddress(body.from).toLowerCase() !==
          ownerEmail.toLowerCase()
      ) {
        throw new Error("Sender does not belong to this mailbox");
      }
      const { data } = await client.sendMessage(
        grantId,
        {
          to: parseAddresses(body.to),
          cc: body.cc ? parseAddresses(body.cc) : undefined,
          bcc: body.bcc ? parseAddresses(body.bcc) : undefined,
          subject: body.subject,
          body: body.messageHtml,
          reply_to_message_id: body.replyToEmail?.messageId,
          attachments: body.attachments?.map((attachment) => ({
            filename: attachment.filename,
            content_type: attachment.contentType,
            content: attachment.content,
            ...(attachment.contentId
              ? { content_id: attachment.contentId }
              : {}),
          })),
        },
        randomUUID(),
      );
      return { messageId: data.id, threadId: data.thread_id };
    },
    async replyToEmail(
      email: ParsedMessage,
      content: string,
      options?: Parameters<EmailProvider["replyToEmail"]>[2],
    ) {
      if (options?.attachments?.length) {
        throw new Error("Nylas IMAP does not support reply attachments yet");
      }
      const { messageId } = await core.sendEmailWithHtml({
        to: options?.replyTo ?? email.headers["reply-to"] ?? email.headers.from,
        cc: options?.cc,
        bcc: options?.bcc,
        subject: email.subject.startsWith("Re:")
          ? email.subject
          : `Re: ${email.subject}`,
        messageHtml: content,
        replyToEmail: { threadId: email.threadId, messageId: email.id },
      });
      return { messageId };
    },
    async getMessagesWithPagination(
      options: Parameters<EmailProvider["getMessagesWithPagination"]>[0],
    ) {
      const folderId = options.inboxOnly
        ? await resolveFolderId(client, grantId, "inbox")
        : await resolveFolderId(client, grantId, options.folderId);
      const { data, next_cursor } = await client.listMessages(grantId, {
        limit: options.maxResults,
        pageToken: options.pageToken,
        folderId,
        query: options.query,
        unread: options.unreadOnly || undefined,
      });
      return {
        messages: data.map(toParsedMessage),
        nextPageToken: next_cursor,
      };
    },
    async searchMessages(
      options: Parameters<EmailProvider["searchMessages"]>[0],
    ) {
      return core.getMessagesWithPagination({
        query: options.query,
        maxResults: options.maxResults,
        pageToken: options.pageToken,
        folderId: options.folderId,
        unreadOnly: options.readState === "unread",
      });
    },
    async getInboxMessages(maxResults?: number) {
      return (
        await core.getMessagesWithPagination({ maxResults, inboxOnly: true })
      ).messages;
    },
    async getThreadMessages(threadId: string) {
      return (await core.getThread(threadId)).messages;
    },
    async getLatestMessageInThread(threadId: string) {
      const { data } = await client.getThread(grantId, threadId);
      return data.latest_draft_or_message
        ? toParsedMessage(data.latest_draft_or_message)
        : null;
    },
    async getLatestMessageFromThreadSnapshot(thread: EmailThread) {
      return thread.messages.at(-1) ?? null;
    },
    async getMessagesBatch(messageIds: string[]) {
      return Promise.all(messageIds.map((id) => core.getMessage(id)));
    },
    async getSendAsAddresses() {
      return [];
    },
    async getSignatures() {
      return [];
    },
    async getContactPhotos() {
      return {};
    },
  };

  return new Proxy(core, {
    get(target, property, receiver) {
      if (property in target) return Reflect.get(target, property, receiver);
      if (typeof property === "symbol" || property === "then") return;
      return () => {
        throw new Error(`Nylas IMAP does not support ${String(property)} yet`);
      };
    },
  }) as EmailProvider;
}

function toEmailThread(thread: NylasThread): EmailThread {
  const latest = thread.latest_draft_or_message;
  return {
    id: thread.id,
    snippet: thread.snippet ?? latest?.snippet ?? "",
    messages: latest
      ? [
          toParsedMessage({
            ...latest,
            thread_id: thread.id,
            date: latest.date ?? thread.latest_message_received_date ?? 0,
          }),
        ]
      : [],
  };
}

function toParsedMessage(message: NylasMessage): ParsedMessage {
  const date = new Date(message.date * 1000).toISOString();
  const attachments = (message.attachments ?? []).map((attachment) => ({
    attachmentId: attachment.id,
    filename: attachment.filename,
    mimeType: attachment.content_type,
    size: attachment.size,
    headers: {
      "content-description": "",
      "content-id": attachment.content_id ?? "",
      "content-transfer-encoding": "",
      "content-type": attachment.content_type,
    },
    inline: attachment.is_inline || attachment.content_disposition === "inline",
  }));
  const regularAttachments = attachments.filter(
    (attachment) => !attachment.inline,
  );
  const inlineAttachments = attachments.filter(
    (attachment) => attachment.inline,
  );
  return {
    id: message.id,
    threadId: message.thread_id,
    historyId: message.id,
    subject: message.subject ?? "",
    snippet: message.snippet ?? "",
    date,
    internalDate: String(message.date * 1000),
    headers: {
      date,
      from: formatAddresses(message.from),
      to: formatAddresses(message.to),
      cc: formatAddresses(message.cc),
      bcc: formatAddresses(message.bcc),
      subject: message.subject ?? "",
    },
    labelIds: [
      ...(message.folders ?? []),
      ...(message.unread ? ["UNREAD"] : []),
      ...(message.starred ? ["STARRED"] : []),
    ],
    parentFolderId: message.folders?.[0],
    hasAttachment: regularAttachments.length > 0,
    attachments: regularAttachments.map(
      ({ inline: _inline, ...attachment }) => attachment,
    ),
    inline: inlineAttachments.map(
      ({ inline: _inline, ...attachment }) => attachment,
    ),
    textHtml: message.body,
  };
}

function formatAddresses(addresses?: NylasAddress[]) {
  return (
    addresses
      ?.map((address) => formatEmailWithName(address.name, address.email))
      .join(", ") ?? ""
  );
}

function parseAddresses(value: string): NylasAddress[] {
  const addresses = splitRecipientList(value).map((recipient) => ({
    email: extractEmailAddress(recipient),
  }));
  if (!addresses.length || addresses.some((address) => !address.email)) {
    throw new Error("Invalid recipient address");
  }
  return addresses;
}

function parseOptionalAddresses(value: string): NylasAddress[] {
  return value.trim() ? parseAddresses(value) : [];
}

async function resolveFolderId(
  client: VinboxNylasClient,
  grantId: string,
  folderId?: string | null,
) {
  if (!folderId) return;
  const systemType = folderId.toUpperCase();
  if (!SYSTEM_FOLDER_TYPES.has(systemType)) return folderId;
  const { data } = await client.listFolders(grantId);
  const folder = findSystemFolder(data, systemType);
  if (!folder)
    throw new Error(`IMAP ${systemType.toLowerCase()} folder was not found`);
  return folder.id;
}

const SYSTEM_FOLDER_TYPES = new Set([
  "INBOX",
  "SENT",
  "DRAFT",
  "DRAFTS",
  "ARCHIVE",
  "TRASH",
  "SPAM",
  "JUNK",
]);

function folderSystemType(folder: NylasFolder) {
  const attributes = folder.attributes?.map((attribute) =>
    attribute.replace(/^\\/, "").toUpperCase(),
  );
  const candidates = [...(attributes ?? []), folder.name.toUpperCase()];
  for (const candidate of candidates) {
    if (candidate === "DRAFTS") return "DRAFT" as const;
    if (candidate === "JUNK") return "SPAM" as const;
    if (SYSTEM_FOLDER_TYPES.has(candidate)) {
      return candidate as "INBOX" | "SENT" | "ARCHIVE" | "TRASH" | "SPAM";
    }
  }
}

function findSystemFolder(folders: NylasFolder[], type: string) {
  const wanted = type === "DRAFTS" ? "DRAFT" : type === "JUNK" ? "SPAM" : type;
  return folders.find((folder) => folderSystemType(folder) === wanted);
}
