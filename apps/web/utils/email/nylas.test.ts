import { beforeEach, describe, expect, it, vi } from "vitest";
import { createNylasProvider } from "./nylas";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  listThreads: vi.fn(),
  listFolders: vi.fn(),
  updateThread: vi.fn(),
  sendMessage: vi.fn(),
}));

vi.mock("@/env", () => ({
  env: { NYLAS_API_KEY: "server-secret", NYLAS_REGION: "us" },
}));
vi.mock("@/utils/prisma", () => ({
  default: { emailAccount: { findUnique: mocks.findUnique } },
}));
vi.mock("@/utils/nylas/vinbox-client", () => ({
  VinboxNylasClient: class {
    listThreads = mocks.listThreads;
    listFolders = mocks.listFolders;
    updateThread = mocks.updateThread;
    sendMessage = mocks.sendMessage;
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.findUnique.mockResolvedValue({
    email: "owner@example.com",
    account: {
      provider: "nylas",
      providerAccountId: "owner-grant",
      disconnectedAt: null,
    },
  });
  mocks.listFolders.mockResolvedValue({
    data: [
      { id: "inbox-folder", name: "INBOX", attributes: ["\\Inbox"] },
      { id: "archive-folder", name: "Archive", attributes: ["\\Archive"] },
    ],
  });
});

describe("createNylasProvider", () => {
  it("derives the grant from the stored account for thread reads", async () => {
    mocks.listThreads.mockResolvedValue({
      data: [
        {
          id: "thread-1",
          snippet: "Hello",
          latest_draft_or_message: {
            id: "message-1",
            thread_id: "thread-1",
            date: 1_700_000_000,
            from: [{ email: "sender@example.com" }],
            to: [{ email: "owner@example.com" }],
          },
        },
      ],
    });
    const provider = await createNylasProvider("account-1");
    const page = await provider.getThreadsWithQuery({
      query: { type: "all" },
    });
    expect(mocks.findUnique).toHaveBeenCalledWith({
      where: { id: "account-1" },
      select: expect.any(Object),
    });
    expect(mocks.listThreads).toHaveBeenCalledWith(
      "owner-grant",
      expect.any(Object),
    );
    expect(page.threads[0].messages[0].headers.from).toBe("sender@example.com");
  });

  it("rejects a provider mismatch before making a Nylas request", async () => {
    mocks.findUnique.mockResolvedValue({
      email: "owner@example.com",
      account: {
        provider: "google",
        providerAccountId: "other-grant",
        disconnectedAt: null,
      },
    });
    await expect(createNylasProvider("account-1")).rejects.toThrow(
      "Nylas account is unavailable",
    );
    expect(mocks.listThreads).not.toHaveBeenCalled();
  });

  it("refuses to send from an address outside the mailbox", async () => {
    const provider = await createNylasProvider("account-1");
    await expect(
      provider.sendEmailWithHtml({
        from: "outsider@example.com",
        to: "recipient@example.com",
        subject: "Hello",
        messageHtml: "<p>Hello</p>",
      }),
    ).rejects.toThrow("Sender does not belong to this mailbox");
    expect(mocks.sendMessage).not.toHaveBeenCalled();
  });

  it("uses the account's actual IMAP inbox folder for inbox pages", async () => {
    mocks.listThreads.mockResolvedValue({ data: [] });
    const provider = await createNylasProvider("account-1");
    await provider.getThreadsWithQuery({ query: { type: "inbox" } });
    expect(mocks.listThreads).toHaveBeenCalledWith(
      "owner-grant",
      expect.objectContaining({ folderId: "inbox-folder" }),
    );
  });

  it("does not archive a thread when the account has no archive folder", async () => {
    mocks.listFolders.mockResolvedValue({ data: [] });
    const provider = await createNylasProvider("account-1");
    await expect(
      provider.archiveThread("thread-1", "owner@example.com"),
    ).rejects.toThrow("archive folder was not found");
    expect(mocks.updateThread).not.toHaveBeenCalled();
  });
});
