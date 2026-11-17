import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/env";
import { withAuth } from "@/utils/middleware";
import { VinboxNylasClient } from "@/utils/nylas/vinbox-client";

export const GET = withAuth("nylas/connect", async (request) => {
  if (!env.NYLAS_API_KEY || !env.NYLAS_CLIENT_ID) {
    return NextResponse.json(
      { error: "IMAP connection is unavailable" },
      { status: 503 },
    );
  }
  const state = randomUUID();
  const redirectUri = new URL(
    "/api/nylas/callback",
    env.NEXT_PUBLIC_BASE_URL,
  ).toString();
  const client = new VinboxNylasClient({
    apiKey: env.NYLAS_API_KEY,
    region: env.NYLAS_REGION,
  });
  const response = NextResponse.redirect(
    client.getHostedAuthUrl({
      clientId: env.NYLAS_CLIENT_ID,
      redirectUri,
      state,
    }),
  );
  response.cookies.set(
    "vinbox_nylas_state",
    `${request.auth.userId}:${state}`,
    {
      httpOnly: true,
      sameSite: "lax",
      secure: redirectUri.startsWith("https:"),
      maxAge: 600,
      path: "/api/nylas/callback",
    },
  );
  return response;
});
