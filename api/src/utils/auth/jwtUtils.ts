import jwt, { SignOptions } from "jsonwebtoken";

const JWT_SECRET: string = process.env.JWT_SECRET || "dev_secret_change_me";
const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || "2h";

export function generateToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as unknown as SignOptions);
}

export function verifyToken(token: string): any {
  return jwt.verify(token, JWT_SECRET);
}
