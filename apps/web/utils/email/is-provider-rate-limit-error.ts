import { extractErrorInfo, isRetryableError } from "@/utils/gmail/retry";
import {
  isProviderRateLimitModeError,
  toRateLimitProvider,
} from "@/utils/email/rate-limit-mode-error";
import {
  extractErrorInfo as extractOutlookErrorInfo,
  isRetryableError as isOutlookRetryableError,
} from "@/utils/outlook/retry";
import { VinboxNylasError } from "@/utils/nylas/vinbox-client";

export function isEmailProviderRateLimitError({
  error,
  provider,
}: {
  error: unknown;
  provider?: string | null;
}) {
  if (isProviderRateLimitModeError(error)) return true;

  const rateLimitProvider = toRateLimitProvider(provider);
  if (rateLimitProvider === "google") {
    return isRetryableError(extractErrorInfo(error)).isRateLimit;
  }
  if (rateLimitProvider === "microsoft") {
    return isOutlookRetryableError(extractOutlookErrorInfo(error)).isRateLimit;
  }
  if (rateLimitProvider === "nylas") {
    return error instanceof VinboxNylasError && error.status === 429;
  }

  return false;
}
