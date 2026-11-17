import { APIError } from "better-auth";
import { env } from "@/env";

const SIGNUP_NOT_ALLOWED_ERROR = {
  message: "signup_not_allowed",
  code: "SIGNUP_NOT_ALLOWED",
} as const;

export function assertAllowedAuthSignupEmail(
  email: string,
  options: {
    allowedEmails?: readonly string[];
    allowedDomains?: readonly string[];
    requireAllowlist?: boolean;
  } = getAuthSignupPolicy(),
) {
  if (isAllowedAuthSignupEmail(email, options)) return;

  throw APIError.from("UNAUTHORIZED", SIGNUP_NOT_ALLOWED_ERROR);
}

export function isAllowedAuthSignupEmail(
  email: string,
  options: {
    allowedEmails?: readonly string[];
    allowedDomains?: readonly string[];
    requireAllowlist?: boolean;
  } = getAuthSignupPolicy(),
) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return false;

  const allowedEmails = (options.allowedEmails ?? [])
    .map(normalizeEmail)
    .filter(Boolean);
  const allowedDomains = (options.allowedDomains ?? [])
    .map(normalizeDomain)
    .filter(Boolean);

  if (allowedEmails.length === 0 && allowedDomains.length === 0)
    return !options.requireAllowlist;
  if (allowedEmails.includes(normalizedEmail)) return true;

  const emailDomain = getEmailDomain(normalizedEmail);
  return !!emailDomain && allowedDomains.includes(emailDomain);
}

function getAuthSignupPolicy() {
  return {
    allowedEmails: env.AUTH_ALLOWED_EMAILS,
    allowedDomains: env.AUTH_ALLOWED_EMAIL_DOMAINS,
    requireAllowlist: env.AUTH_REQUIRE_ALLOWLIST,
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeDomain(domain: string) {
  return domain.trim().replace(/^@/, "").toLowerCase();
}

function getEmailDomain(email: string) {
  const atIndex = email.lastIndexOf("@");
  if (atIndex === -1) return "";

  return email.slice(atIndex + 1).toLowerCase();
}
