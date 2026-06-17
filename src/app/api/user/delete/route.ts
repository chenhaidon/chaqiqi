import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, getCurrentUser } from "@/lib/authSession";
import { deleteUserAccount, getUserByEmail } from "@/lib/authRepo";
import { verifyPassword } from "@/lib/auth";

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

  const password = typeof body.password === "string" ? body.password : "";
  const fullUser = getUserByEmail(currentUser.email);
  if (!fullUser || !verifyPassword(password, fullUser.passwordHash)) {
    return NextResponse.json({ error: "当前密码错误" }, { status: 400 });
  }

  deleteUserAccount(currentUser.id);
  clearSessionCookie();
  return NextResponse.json({ ok: true, message: "账号已注销" });
}
