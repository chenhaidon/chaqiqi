import { getCurrentUser } from "./authSession";
import { getUserByEmail, createUser, updateUserPassword, setUserEmailVerified } from "./authRepo";
import { hashPassword, verifyPassword } from "./auth";

const DEFAULT_ADMIN_USERNAME = "admin";
const DEFAULT_ADMIN_EMAIL = "admin@chaqiqi.local";

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function getAdminUsername(): string {
  return (process.env.ADMIN_USERNAME || DEFAULT_ADMIN_USERNAME).trim() || DEFAULT_ADMIN_USERNAME;
}

export function getAdminEmail(): string {
  return (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase() || DEFAULT_ADMIN_EMAIL;
}

export function isAdminUserEmail(email: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return false;
  return normalizedEmail === getAdminEmail() || getAdminEmails().includes(normalizedEmail);
}

export function requireAdminUser() {
  const user = getCurrentUser();
  if (!user) return null;
  return isAdminUserEmail(user.email) ? user : null;
}

export function ensureAdminUser() {
  const password = process.env.ADMIN_PASSWORD || "";
  if (!password) {
    throw new Error("未配置 ADMIN_PASSWORD，无法初始化管理员账号");
  }

  const email = getAdminEmail();
  const existing = getUserByEmail(email);
  if (!existing) {
    const user = createUser(email, hashPassword(password));
    setUserEmailVerified(user.id, true);
    return getUserByEmail(email);
  }

  if (!existing.emailVerified) {
    setUserEmailVerified(existing.id, true);
  }
  return getUserByEmail(email);
}

export function authenticateAdmin(username: string, password: string) {
  const normalizedUsername = username.trim();
  if (normalizedUsername !== getAdminUsername()) {
    return { user: null as ReturnType<typeof getUserByEmail>, reason: "管理员账号或密码错误" };
  }

  const admin = ensureAdminUser();
  if (!admin || !verifyPassword(password, admin.passwordHash)) {
    return { user: null as ReturnType<typeof getUserByEmail>, reason: "管理员账号或密码错误" };
  }

  return { user: admin, reason: undefined };
}
