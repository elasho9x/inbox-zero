import "server-only";

/**
 * Small authenticated Nylas v3 transport for VINBOX.
 * Provider onboarding and ownership checks must live in authenticated server services.
 * Never expose this class or a grant ID as an unrestricted API endpoint.
 */
export type NylasRegion = "us" | "eu";

export type NylasMessageSummary = {
  id: string;
  grant_id?: string;
  thread_id?: string;
  subject?: string;
  snippet?: string;
  date?: number;
  unread?: boolean;
  starred?: boolean;
  from?: Array<{ email: string; name?: string }>;
};

type NylasEnvelope<T> = { data: T; next_cursor?: string; request_id?: string };

export class VinboxNylasError extends Error {
  constructor(
    readonly status: number,
    readonly retryAfter: string | null,
  ) {
    super(`Nylas API returned HTTP ${status}`);
    this.name = "VinboxNylasError";
  }
}

export class VinboxNylasClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor({ apiKey, region }: { apiKey: string; region: NylasRegion }) {
    if (!apiKey.trim()) throw new Error("Missing Nylas API key");
    this.apiKey = apiKey;
    this.baseUrl = `https://api.${region}.nylas.com/v3`;
  }

  async listMessages(
    grantId: string,
    options: { limit?: number; pageToken?: string; unread?: boolean } = {},
  ): Promise<NylasEnvelope<NylasMessageSummary[]>> {
    const query = new URLSearchParams();
    query.set("limit", String(Math.max(1, Math.min(options.limit ?? 20, 200))));
    if (options.pageToken) query.set("page_token", options.pageToken);
    if (options.unread !== undefined) query.set("unread", String(options.unread));
    return this.request(grantId, `messages?${query.toString()}`);
  }

  async getMessage(
    grantId: string,
    messageId: string,
  ): Promise<NylasEnvelope<NylasMessageSummary & { body?: string }>> {
    if (!messageId.trim()) throw new Error("Missing message ID");
    return this.request(grantId, `messages/${encodeURIComponent(messageId)}`);
  }

  private async request<T>(grantId: string, suffix: string): Promise<T> {
    if (!grantId.trim()) throw new Error("Missing Nylas grant ID");
    const response = await fetch(
      `${this.baseUrl}/grants/${encodeURIComponent(grantId)}/${suffix}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );
    if (!response.ok) {
      throw new VinboxNylasError(
        response.status,
        response.headers.get("retry-after"),
      );
    }
    return (await response.json()) as T;
  }
}
