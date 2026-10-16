import crypto from "crypto";

const SECRET =
  process.env.PENDING_SIGNUP_SECRET ||
  process.env.JWT_SECRET ||
  "change-me-in-production";

const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface PendingSignupPayload {
  institutionType: string;
  licenseType: string;
  institutionName: string;
  institutionEmail: string;
  institutionPhone: string;
  adminFullName: string;
  adminEmail: string;
  adminPhone: string;
  adminPasswordHash: string; // hashed before signing — never raw password
  iat: number;
  exp: number;
}

export function signPendingSignup(
  data: Omit<PendingSignupPayload, "iat" | "exp">,
  ttlMs: number = DEFAULT_TTL_MS,
): string {
  const now = Date.now();
  const payload: PendingSignupPayload = {
    ...data,
    iat: now,
    exp: now + ttlMs,
  };

  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json).toString("base64url");
  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(b64)
    .digest("base64url");

  return `${b64}.${sig}`;
}

export function verifyPendingSignup(token: string): PendingSignupPayload {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    throw new Error("Invalid pending signup token");
  }

  const [b64, sig] = token.split(".");
  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(b64)
    .digest("base64url");

  // Constant-time comparison
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error("Invalid pending signup token");
  }

  const payload: PendingSignupPayload = JSON.parse(
    Buffer.from(b64, "base64url").toString("utf8"),
  );

  if (Date.now() > payload.exp) {
    throw new Error("Signup session expired. Please start again.");
  }

  return payload;
}