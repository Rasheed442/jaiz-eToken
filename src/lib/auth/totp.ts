import { hmac } from "@noble/hashes/hmac.js";
import { sha1 } from "@noble/hashes/legacy.js";
import * as OTPAuth from "otpauth/bare";

export type TotpCredentials = {
  secret: string;
  algorithm: string;
  digits: number;
  periodSeconds: number;
  issuedAt: string;
};

/**
 * Validates and normalizes raw TOTP credentials (from the API or from storage).
 * - Accepts numbers sent as strings (e.g. "6", "30").
 * - Cleans the secret (removes spaces/dashes, uppercases).
 * - Fills `issuedAt` if the server did not send one.
 * Returns null if the credentials are unusable.
 */
export function normalizeTotpCredentials(input: unknown): TotpCredentials | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;

  const secret =
    typeof raw.secret === "string"
      ? raw.secret.replace(/[\s-]/g, "").toUpperCase()
      : "";
  const algorithm =
    typeof raw.algorithm === "string" ? raw.algorithm.trim() : "";
  const digits = Number(raw.digits);
  const periodSeconds = Number(raw.periodSeconds ?? raw.period);

  if (
    !secret ||
    !algorithm ||
    !Number.isInteger(digits) ||
    digits < 6 ||
    digits > 10 ||
    !Number.isInteger(periodSeconds) ||
    periodSeconds <= 0
  ) {
    return null;
  }

  const issuedAt =
    typeof raw.issuedAt === "string" && raw.issuedAt
      ? raw.issuedAt
      : new Date().toISOString();

  return { secret, algorithm, digits, periodSeconds, issuedAt };
}

export function createTotp(input: TotpCredentials): OTPAuth.TOTP {
  const credentials = normalizeTotpCredentials(input);
  if (!credentials) {
    throw new Error("The provisioned TOTP settings are invalid.");
  }

  const algorithm = credentials.algorithm
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase();
  if (algorithm !== "SHA1") {
    throw new Error("The provisioned TOTP algorithm is not supported.");
  }

  return new OTPAuth.TOTP({
    secret: OTPAuth.Secret.fromBase32(credentials.secret),
    algorithm,
    digits: credentials.digits,
    period: credentials.periodSeconds,
    hmac: (requestedAlgorithm, key, message) => {
      if (requestedAlgorithm.toUpperCase() !== "SHA1") {
        throw new Error("The provisioned TOTP algorithm is not supported.");
      }
      return hmac(sha1, key, message);
    }
  });
}