import crypto from "crypto";
import {
  createSession,
  deleteSessionsByUserId,
  getUserByEmail,
  getUserById,
  saveEmailVerificationToken,
  savePasswordResetToken,
  consumeEmailVerificationToken,
  consumePasswordResetToken,
  markUserEmailVerified,
  updateUserPassword,
} from "./authRepo";
import type { User } from "./types";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const EMAIL_TOKEN_TTL_MS = 1000 * 60 * 10;
const RESET_TOKEN_TTL_MS = 1000 * 60 * 30;

function hashText(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return "密码至少 8 位";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "密码需同时包含字母和数字";
  }
  return null;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const stored = Buffer.from(hash, "hex");
  if (derived.length !== stored.length) return false;
  return crypto.timingSafeEqual(derived, stored);
}

export function createOpaqueToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function createEmailVerification(userId: string): string {
  const token = createOpaqueToken();
  saveEmailVerificationToken(userId, hashText(token), Date.now() + EMAIL_TOKEN_TTL_MS);
  return token;
}

export function verifyEmailToken(token: string): User | null {
  const record = consumeEmailVerificationToken(hashText(token));
  if (!record || record.expiresAt < Date.now()) return null;
  markUserEmailVerified(record.userId);
  return getUserById(record.userId);
}

export function createPasswordReset(userId: string): string {
  const token = createOpaqueToken();
  savePasswordResetToken(userId, hashText(token), Date.now() + RESET_TOKEN_TTL_MS);
  return token;
}

export function resetPasswordByToken(token: string, password: string): User | null {
  const record = consumePasswordResetToken(hashText(token));
  if (!record || record.expiresAt < Date.now()) return null;
  updateUserPassword(record.userId, hashPassword(password));
  deleteSessionsByUserId(record.userId);
  return getUserById(record.userId);
}

export function createLoginSession(userId: string): string {
  const session = createSession(userId, Date.now() + SESSION_TTL_MS);
  return session.id;
}

export function authenticateUser(email: string, password: string): { user: User | null; reason?: string } {
  const found = getUserByEmail(normalizeEmail(email));
  if (!found) return { user: null, reason: "邮箱或密码错误" };
  if (!verifyPassword(password, found.passwordHash)) {
    return { user: null, reason: "邮箱或密码错误" };
  }
  if (!found.emailVerified) {
    return { user: null, reason: "请先完成邮箱验证" };
  }
  const { passwordHash: _passwordHash, ...user } = found;
  return { user };
}

export function findUserForPasswordReset(email: string): User | null {
  const found = getUserByEmail(normalizeEmail(email));
  if (!found) return null;
  const { passwordHash: _passwordHash, ...user } = found;
  return user;
}
