import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/env";
import { withAuth } from "@/utils/middleware";
import { VinboxNylasClient } from "@/utils/nylas/vinbox-client";
import prisma from "@/utils/prisma";

export const GET = withAuth("nylas/callback", async (request) => {
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const storedState = request.cookies.get("vinbox_nylas_state")?.value;
  const result = (status: "connected" | "failed") => {
    const response = NextResponse.redirect(
      new URL(`/accounts?nylas=${status}`, env.NEXT_PUBLIC_BASE_URL),
    );
    response.cookies.set("vinbox_nylas_state", "", {
      maxAge: 0,
      path: "/api/nylas/callback",
    });
    return response;
  };

  if (
    !state ||
    !code ||
    !storedState ||
    storedState !== `${request.auth.userId}:${state}` ||
    !env.NYLAS_API_KEY ||
    !env.NYLAS_CLIENT_ID
  ) {
    return result("failed");
  }

  const client = new VinboxNylasClient({
    apiKey: env.NYLAS_API_KEY,
    region: env.NYLAS_REGION,
  });
  const redirectUri = new URL(
    "/api/nylas/callback",
    env.NEXT_PUBLIC_BASE_URL,
  ).toString();
  try {
    const exchanged = await client.exchangeCode({
      clientId: env.NYLAS_CLIENT_ID,
      redirectUri,
      code,
    });
    if (exchanged.provider !== "imap" || !exchanged.grant_id) {
      return result("failed");
    }
    const { data: grant } = await client.getGrant(exchanged.grant_id);
    const email = grant.email.trim().toLowerCase();
    if (
      grant.id !== exchanged.grant_id ||
      grant.provider !== "imap" ||
      grant.grant_status !== "valid" ||
      email !== exchanged.email.trim().toLowerCase()
    ) {
      return result("failed");
    }

    const existing = await prisma.emailAccount.findUnique({
      where: { email },
      select: {
        userId: true,
        account: { select: { id: true, provider: true } },
      },
    });
    if (existing) {
      if (
        existing.userId !== request.auth.userId ||
        existing.account.provider !== "nylas"
      ) {
        return result("failed");
      }
      await prisma.account.update({
        where: { id: existing.account.id, userId: request.auth.userId },
        data: { providerAccountId: grant.id, disconnectedAt: null },
      });
    } else {
      await prisma.account.create({
        data: {
          id: randomUUID(),
          userId: request.auth.userId,
          provider: "nylas",
          providerAccountId: grant.id,
          type: "nylas",
          emailAccount: {
            create: {
              email,
              userId: request.auth.userId,
              includeSentWithSignature: false,
              sentMessageOpenTrackingEnabled: false,
              mailSetup: "DONE",
            },
          },
        },
      });
    }
    return result("connected");
  } catch (error) {
    request.logger.warn("Failed to connect Nylas IMAP grant", {
      error,
      userId: request.auth.userId,
    });
    return result("failed");
  }
});
