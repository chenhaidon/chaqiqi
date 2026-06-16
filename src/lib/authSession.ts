import { cookies } from "next/headers";
import { deleteSession, getSession } from "./authRepo";
import { getUserById } from "./authRepo";
import type { User } from "./types";

const SESSION_COOKIE = "chaqiqi_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

export function setSessionCookie(sessionId: string): void {
  cookies().set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: IS_PRODUCTION,
    path: "/",
    expires: new Date(Date.now() + SESSION_TTL_MS),
  });
}

export function clearSessionCookie(): void {
  cookies().set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: IS_PRODUCTION,
    path: "/",
    expires: new Date(0),
  });
}

export function getCurrentSessionId(): string | null {
  return cookies().get(SESSION_COOKIE)?.value || null;
}

export function getCurrentUser(): User | null {
  const sessionId = getCurrentSessionId();
  if (!sessionId) return null;
  const session = getSession(sessionId);
  if (!session || session.expiresAt < Date.now()) {
    if (session) deleteSession(session.id);
    clearSessionCookie();
    return null;
  }
  return getUserById(session.userId);
}

export function logoutCurrentSession(): void {
  const sessionId = getCurrentSessionId();
  if (sessionId) deleteSession(sessionId);
  clearSessionCookie();
}
