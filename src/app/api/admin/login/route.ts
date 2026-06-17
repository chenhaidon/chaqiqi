import { NextRequest, NextResponse } from "next/server";
import { createLoginSession } from "@/lib/auth";
import { setSessionCookie } from "@/lib/authSession";
import { authenticateAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!username.trim() || !password) {
    return NextResponse.json({ error: "请输入管理员账号和密码" }, { status: 400 });
  }

  try {
    const { user, reason } = authenticateAdmin(username, password);
    if (!user) {
      return NextResponse.json({ error: reason || "管理员登录失败" }, { status: 401 });
    }

    const sessionId = createLoginSession(user.id);
    setSessionCookie(sessionId);
    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "管理员登录失败" }, { status: 500 });
  }
}
