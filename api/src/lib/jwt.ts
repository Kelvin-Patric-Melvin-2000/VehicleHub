import jwt from "jsonwebtoken";

const COOKIE_NAME = "vh_token";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export { COOKIE_NAME, SEVEN_DAYS_MS };

function getSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is required");
  return s;
}

export function signUserToken(userId: string): string {
  return jwt.sign({ sub: userId }, getSecret(), { expiresIn: "7d" });
}

export function verifyUserToken(token: string): { sub: string } {
  return jwt.verify(token, getSecret()) as { sub: string };
}
