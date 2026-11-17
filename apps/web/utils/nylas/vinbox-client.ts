import "server-only";

export type NylasRegion = "us" | "eu";
export type NylasAddress = { email: string; name?: string };
export type NylasMessage = {
  id: string;
  thread_id: string;
  date: number;
  subject?: string;
  snippet?: string;
  body?: string;
  unread?: boolean;
  starred?: boolean;
  folders?: string[];
  from?: NylasAddress[];
  to?: NylasAddress[];
  cc?: NylasAddress[];
  bcc?: NylasAddress[];
  attachments?: Array<{
    id: string;
    filename: string;
    content_type: string;
    size: number;
    is_inline?: boolean;
    content_disposition?: string;
    content_id?: string;
  }>;
};
export type NylasThread = {
  id: string;
  subject?: string;
  snippet?: string;
  latest_message_received_date?: number;
  latest_draft_or_message?: NylasMessage;
  message_ids?: string[];
  folders?: string[];
  unread?: boolean;
  starred?: boolean;
};
export type NylasFolder = {
  id: string;
  name: string;
  attributes?: string[];
  total_count?: number;
  unread_count?: number;
};
type Envelope<T> = { data: T; next_cursor?: string; request_id?: string };

export class VinboxNylasError extends Error {
  readonly status: number;
  readonly retryAfter: string | null;

  constructor(status: number, retryAfter: string | null) {
    super(`Nylas API returned HTTP ${status}`);
    this.name = "VinboxNylasError";
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

export class VinboxNylasClient {
  private readonly baseUrl: string;
  private readonly config: { apiKey: string; region: NylasRegion };

  constructor(config: { apiKey: string; region: NylasRegion }) {
    if (!config.apiKey.trim()) throw new Error("Missing Nylas API key");
    this.config = config;
    this.baseUrl = `https://api.${config.region}.nylas.com/v3`;
  }

  getHostedAuthUrl(input: {
    clientId: string;
    redirectUri: string;
    state: string;
  }) {
    const url = new URL(`${this.baseUrl}/connect/auth`);
    url.search = new URLSearchParams({
      client_id: input.clientId,
      redirect_uri: input.redirectUri,
      response_type: "code",
      provider: "imap",
      options: "smtp_required",
      state: input.state,
    }).toString();
    return url;
  }

  async exchangeCode(input: {
    clientId: string;
    redirectUri: string;
    code: string;
  }): Promise<{ grant_id: string; email: string; provider: string }> {
    return this.request("connect/token", {
      method: "POST",
      body: {
        client_id: input.clientId,
        client_secret: this.config.apiKey,
        grant_type: "authorization_code",
        code: input.code,
        redirect_uri: input.redirectUri,
      },
      authenticated: false,
    });
  }

  async getGrant(grantId: string) {
    return this.request<
      Envelope<{
        id: string;
        email: string;
        provider: string;
        grant_status: string;
      }>
    >(`grants/${encodeURIComponent(grantId)}`);
  }

  async listMessages(
    grantId: string,
    options: {
      limit?: number;
      pageToken?: string;
      unread?: boolean;
      starred?: boolean;
      folderId?: string;
      query?: string;
    } = {},
  ): Promise<Envelope<NylasMessage[]>> {
    return this.request(grantPath(grantId, `messages?${listQuery(options)}`));
  }

  async getMessage(grantId: string, messageId: string) {
    return this.request<Envelope<NylasMessage>>(
      grantPath(grantId, `messages/${encodeURIComponent(messageId)}`),
    );
  }

  async listThreads(
    grantId: string,
    options: {
      limit?: number;
      pageToken?: string;
      unread?: boolean;
      starred?: boolean;
      folderId?: string;
      query?: string;
    } = {},
  ): Promise<Envelope<NylasThread[]>> {
    return this.request(grantPath(grantId, `threads?${listQuery(options)}`));
  }

  async getThread(grantId: string, threadId: string) {
    return this.request<Envelope<NylasThread>>(
      grantPath(grantId, `threads/${encodeURIComponent(threadId)}`),
    );
  }

  async updateThread(
    grantId: string,
    threadId: string,
    update: { unread?: boolean; starred?: boolean; folders?: string[] },
  ) {
    return this.request<Envelope<NylasThread>>(
      grantPath(grantId, `threads/${encodeURIComponent(threadId)}`),
      { method: "PUT", body: update },
    );
  }

  async deleteThread(grantId: string, threadId: string) {
    await this.request<void>(
      grantPath(grantId, `threads/${encodeURIComponent(threadId)}`),
      { method: "DELETE" },
    );
  }

  async listFolders(grantId: string) {
    return this.request<Envelope<NylasFolder[]>>(grantPath(grantId, "folders"));
  }

  async createFolder(grantId: string, name: string) {
    return this.request<Envelope<NylasFolder>>(grantPath(grantId, "folders"), {
      method: "POST",
      body: { name },
    });
  }

  async renameFolder(grantId: string, folderId: string, name: string) {
    return this.request<Envelope<NylasFolder>>(
      grantPath(grantId, `folders/${encodeURIComponent(folderId)}`),
      { method: "PUT", body: { name } },
    );
  }

  async deleteFolder(grantId: string, folderId: string) {
    await this.request<void>(
      grantPath(grantId, `folders/${encodeURIComponent(folderId)}`),
      { method: "DELETE" },
    );
  }

  async downloadAttachment(
    grantId: string,
    messageId: string,
    attachmentId: string,
  ) {
    const path = grantPath(
      grantId,
      `attachments/${encodeURIComponent(attachmentId)}/download?message_id=${encodeURIComponent(messageId)}`,
    );
    const response = await fetch(`${this.baseUrl}/${path}`, {
      headers: { Authorization: `Bearer ${this.config.apiKey}` },
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok || !response.body) {
      throw new VinboxNylasError(
        response.status,
        response.headers.get("retry-after"),
      );
    }
    return response.body;
  }

  async updateMessage(
    grantId: string,
    messageId: string,
    update: { unread?: boolean; starred?: boolean; folders?: string[] },
  ) {
    return this.request<Envelope<NylasMessage>>(
      grantPath(grantId, `messages/${encodeURIComponent(messageId)}`),
      { method: "PUT", body: update },
    );
  }

  async deleteMessage(grantId: string, messageId: string) {
    await this.request<void>(
      grantPath(grantId, `messages/${encodeURIComponent(messageId)}`),
      { method: "DELETE" },
    );
  }

  async sendMessage(
    grantId: string,
    message: {
      to: NylasAddress[];
      cc?: NylasAddress[];
      bcc?: NylasAddress[];
      subject: string;
      body: string;
      reply_to_message_id?: string;
      attachments?: Array<{
        filename: string;
        content_type: string;
        content: string;
        content_id?: string;
      }>;
    },
    idempotencyKey: string,
  ) {
    return this.request<Envelope<{ id: string; thread_id: string }>>(
      grantPath(grantId, "messages/send"),
      {
        method: "POST",
        body: message,
        headers: { "Idempotency-Key": idempotencyKey },
      },
    );
  }

  async listDrafts(grantId: string, limit = 50) {
    return this.request<Envelope<NylasMessage[]>>(
      grantPath(grantId, `drafts?limit=${Math.max(1, Math.min(limit, 200))}`),
    );
  }

  async getDraft(grantId: string, draftId: string) {
    return this.request<Envelope<NylasMessage>>(
      grantPath(grantId, `drafts/${encodeURIComponent(draftId)}`),
    );
  }

  async createDraft(
    grantId: string,
    draft: {
      to: NylasAddress[];
      cc?: NylasAddress[];
      bcc?: NylasAddress[];
      subject: string;
      body: string;
      reply_to_message_id?: string;
    },
  ) {
    return this.request<Envelope<NylasMessage>>(grantPath(grantId, "drafts"), {
      method: "POST",
      body: draft,
    });
  }

  async updateDraft(
    grantId: string,
    draftId: string,
    draft: {
      to?: NylasAddress[];
      cc?: NylasAddress[];
      bcc?: NylasAddress[];
      subject?: string;
      body?: string;
    },
  ) {
    return this.request<Envelope<NylasMessage>>(
      grantPath(grantId, `drafts/${encodeURIComponent(draftId)}`),
      { method: "PUT", body: draft },
    );
  }

  async deleteDraft(grantId: string, draftId: string) {
    await this.request<void>(
      grantPath(grantId, `drafts/${encodeURIComponent(draftId)}`),
      { method: "DELETE" },
    );
  }

  async sendDraft(grantId: string, draftId: string) {
    return this.request<Envelope<{ id: string; thread_id: string }>>(
      grantPath(grantId, `drafts/${encodeURIComponent(draftId)}`),
      { method: "POST" },
    );
  }

  private async request<T>(
    path: string,
    options: {
      method?: "GET" | "POST" | "PUT" | "DELETE";
      body?: unknown;
      authenticated?: boolean;
      headers?: Record<string, string>;
    } = {},
  ): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await fetch(`${this.baseUrl}/${path}`, {
        method: options.method ?? "GET",
        headers: {
          ...(options.authenticated === false
            ? {}
            : { Authorization: `Bearer ${this.config.apiKey}` }),
          Accept: "application/json",
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      });
      if (response.ok) {
        if (response.status === 204) return undefined as T;
        return (await response.json()) as T;
      }
      if (
        attempt === 2 ||
        ![429, 502, 503, 504].includes(response.status) ||
        (path.endsWith("messages/send") && response.status === 429)
      ) {
        throw new VinboxNylasError(
          response.status,
          response.headers.get("retry-after"),
        );
      }
      const retrySeconds = Number(response.headers.get("retry-after"));
      await new Promise((resolve) =>
        setTimeout(
          resolve,
          Number.isFinite(retrySeconds) && retrySeconds > 0
            ? Math.min(retrySeconds * 1000, 5000)
            : 250 * 2 ** attempt,
        ),
      );
    }
    throw new Error("Nylas request retry limit exceeded");
  }
}

function grantPath(grantId: string, suffix: string) {
  if (!grantId.trim()) throw new Error("Missing Nylas grant ID");
  return `grants/${encodeURIComponent(grantId)}/${suffix}`;
}

function listQuery(options: {
  limit?: number;
  pageToken?: string;
  unread?: boolean;
  starred?: boolean;
  folderId?: string;
  query?: string;
}) {
  const query = new URLSearchParams();
  query.set("limit", String(Math.max(1, Math.min(options.limit ?? 20, 200))));
  if (options.pageToken) query.set("page_token", options.pageToken);
  if (options.unread !== undefined) query.set("unread", String(options.unread));
  if (options.starred !== undefined)
    query.set("starred", String(options.starred));
  if (options.folderId) query.set("in", options.folderId);
  if (options.query) query.set("search_query_native", options.query);
  return query.toString();
}
