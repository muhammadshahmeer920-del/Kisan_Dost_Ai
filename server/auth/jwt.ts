import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "kisan_dost_dev_secret_change_in_production";

if (!process.env.JWT_SECRET) {
  console.warn("[JWT] ⚠️  JWT_SECRET not set — using dev-only constant. Set JWT_SECRET in .env for production.");
}

interface TokenPayload {
  userId: string;
  phone: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
