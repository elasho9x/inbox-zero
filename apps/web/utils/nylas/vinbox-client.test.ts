import { afterEach, describe, expect, it, vi } from "vitest";
import { VinboxNylasClient, VinboxNylasError } from "./vinbox-client";

vi.mock("server-only", () => ({}));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("VinboxNylasClient", () => {
  it("constrains hosted connection to IMAP with SMTP required", () => {
    const client = new VinboxNylasClient({
      apiKey: "server-secret",
      region: "eu",
    });
    const url = client.getHostedAuthUrl({
      clientId: "app-id",
      redirectUri: "https://mail.example.com/api/nylas/callback",
      state: "state-token",
    });
    expect(url.origin).toBe("https://api.eu.nylas.com");
    expect(url.searchParams.get("provider")).toBe("imap");
    expect(url.searchParams.get("options")).toBe("smtp_required");
    expect(url.searchParams.get("state")).toBe("state-token");
    expect(url.toString()).not.toContain("server-secret");
  });

  it("encodes provider IDs and returns only status on errors", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ error: "secret-provider-detail" }), {
          status: 403,
          headers: { "content-type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const client = new VinboxNylasClient({
      apiKey: "server-secret",
      region: "us",
    });
    await expect(
      client.getMessage("grant/1", "message?1"),
    ).rejects.toMatchObject({
      status: 403,
      message: "Nylas API returned HTTP 403",
    } satisfies Partial<VinboxNylasError>);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain("/grants/grant%2F1/messages/message%3F1");
    expect(options.headers.Authorization).toBe("Bearer server-secret");
  });

  it("does not replay a throttled send with its cached idempotency key", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 429 }));
    vi.stubGlobal("fetch", fetchMock);
    const client = new VinboxNylasClient({
      apiKey: "server-secret",
      region: "us",
    });
    await expect(
      client.sendMessage(
        "grant",
        {
          to: [{ email: "staff@example.com" }],
          subject: "Hello",
          body: "Hello",
        },
        "logical-send",
      ),
    ).rejects.toMatchObject({ status: 429 });
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
