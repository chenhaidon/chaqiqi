import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, createLoginSession, normalizeEmail, validateEmail } from "@/lib/auth";
import { setSessionCookie } from "@/lib/authSession";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  const email = normalizeEmail(typeof body.email === "string" ? body.email : "");
  const password = typeof body.password === "string" ? body.password : "";

  if (!validateEmail(email) || !password) {
    return NextResponse.json({ error: "邮箱或密码格式错误" }, { status: 400 });
  }

  const { user, reason } = authenticateUser(email, password);
  if (!user) {
    return NextResponse.json({ error: reason || "登录失败" }, { status: 401 });
  }

  const sessionId = createLoginSession(user.id);
  setSessionCookie(sessionId);
  return NextResponse.json({ user });
}
