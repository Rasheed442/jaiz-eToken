import * as OTPAuth from "otpauth/bare";
import { hmac } from "@noble/hashes/hmac.js";
import { sha1 } from "@noble/hashes/legacy.js";

export type TotpCredentials = {
  secret: string;
  algorithm: string;
  digits: number;
  periodSeconds: number;
  issuedAt: string;
};

export function createTotp(credentials: TotpCredentials): OTPAuth.TOTP {
  const algorithm = credentials.algorithm.replace(/[^a-z0-9]/gi, "").toUpperCase();
  if (algorithm !== "SHA1") {
    throw new Error("The provisioned TOTP algorithm is not supported.");
  }
  if (
    !credentials.secret ||
    !Number.isInteger(credentials.digits) ||
    credentials.digits < 6 ||
    credentials.digits > 10 ||
    !Number.isInteger(credentials.periodSeconds) ||
    credentials.periodSeconds <= 0
  ) {
    throw new Error("The provisioned TOTP settings are invalid.");
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
