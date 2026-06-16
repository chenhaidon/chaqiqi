import crypto from "crypto";
import { getDb } from "./db";
import type { AuthSession, User } from "./types";

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  email_verified: number;
  created_at: string;
};

type SessionRow = {
  id: string;
  user_id: string;
  expires_at: number;
};

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    emailVerified: row.email_verified === 1,
    createdAt: row.created_at,
  };
}

export function createUser(email: string, passwordHash: string): User {
  const db = getDb();
  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)`
  ).run(id, email.toLowerCase(), passwordHash);
  const row = db
    .prepare(
      `SELECT id, email, password_hash, email_verified, created_at FROM users WHERE id = ?`
    )
    .get(id) as UserRow;
  return mapUser(row);
}

export function getUserByEmail(email: string): (User & { passwordHash: string }) | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id, email, password_hash, email_verified, created_at FROM users WHERE email = ?`
    )
    .get(email.toLowerCase()) as UserRow | undefined;
  if (!row) return null;
  return { ...mapUser(row), passwordHash: row.password_hash };
}

export function getUserById(id: string): User | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id, email, password_hash, email_verified, created_at FROM users WHERE id = ?`
    )
    .get(id) as UserRow | undefined;
  return row ? mapUser(row) : null;
}

export function markUserEmailVerified(userId: string): void {
  getDb()
    .prepare(
      `UPDATE users SET email_verified = 1, updated_at = datetime('now','localtime') WHERE id = ?`
    )
    .run(userId);
}

export function updateUserPassword(userId: string, passwordHash: string): void {
  getDb()
    .prepare(
      `UPDATE users SET password_hash = ?, updated_at = datetime('now','localtime') WHERE id = ?`
    )
    .run(passwordHash, userId);
}

export function refreshUnverifiedUser(userId: string, passwordHash: string): void {
  getDb()
    .prepare(
      `UPDATE users SET password_hash = ?, email_verified = 0, updated_at = datetime('now','localtime') WHERE id = ?`
    )
    .run(passwordHash, userId);
}

export function createSession(userId: string, expiresAt: number): AuthSession {
  const id = crypto.randomUUID();
  getDb()
    .prepare(`INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)`)
    .run(id, userId, expiresAt);
  return { id, userId, expiresAt };
}

export function getSession(sessionId: string): AuthSession | null {
  const row = getDb()
    .prepare(`SELECT id, user_id, expires_at FROM sessions WHERE id = ?`)
    .get(sessionId) as SessionRow | undefined;
  if (!row) return null;
  return { id: row.id, userId: row.user_id, expiresAt: row.expires_at };
}

export function deleteSession(sessionId: string): void {
  getDb().prepare(`DELETE FROM sessions WHERE id = ?`).run(sessionId);
}

export function deleteSessionsByUserId(userId: string): void {
  getDb().prepare(`DELETE FROM sessions WHERE user_id = ?`).run(userId);
}

export function saveEmailVerificationToken(userId: string, tokenHash: string, expiresAt: number): void {
  const db = getDb();
  db.prepare(`DELETE FROM email_verification_tokens WHERE user_id = ?`).run(userId);
  db.prepare(
    `INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)`
  ).run(crypto.randomUUID(), userId, tokenHash, expiresAt);
}

export function consumeEmailVerificationToken(tokenHash: string): { userId: string; expiresAt: number } | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT id, user_id, expires_at FROM email_verification_tokens WHERE token_hash = ?`)
    .get(tokenHash) as { id: string; user_id: string; expires_at: number } | undefined;
  if (!row) return null;
  db.prepare(`DELETE FROM email_verification_tokens WHERE id = ?`).run(row.id);
  return { userId: row.user_id, expiresAt: row.expires_at };
}

export function savePasswordResetToken(userId: string, tokenHash: string, expiresAt: number): void {
  const db = getDb();
  db.prepare(`DELETE FROM password_reset_tokens WHERE user_id = ?`).run(userId);
  db.prepare(
    `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)`
  ).run(crypto.randomUUID(), userId, tokenHash, expiresAt);
}

export function consumePasswordResetToken(tokenHash: string): { userId: string; expiresAt: number } | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT id, user_id, expires_at FROM password_reset_tokens WHERE token_hash = ?`)
    .get(tokenHash) as { id: string; user_id: string; expires_at: number } | undefined;
  if (!row) return null;
  db.prepare(`DELETE FROM password_reset_tokens WHERE id = ?`).run(row.id);
  return { userId: row.user_id, expiresAt: row.expires_at };
}
