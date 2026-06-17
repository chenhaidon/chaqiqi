import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, getCurrentUser } from "@/lib/authSession";
import { deleteSessionsByUserId, getUserByEmail, updateUserPassword } from "@/lib/authRepo";
import { hashPassword, validatePassword, verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  const fullUser = getUserByEmail(currentUser.email);
  if (!fullUser || !verifyPassword(currentPassword, fullUser.passwordHash)) {
    return NextResponse.json({ error: "当前密码错误" }, { status: 400 });
  }

  updateUserPassword(currentUser.id, hashPassword(newPassword));
  deleteSessionsByUserId(currentUser.id);
  clearSessionCookie();
  return NextResponse.json({ ok: true, message: "密码已修改，请重新登录" });
}
