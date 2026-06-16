import { NextRequest, NextResponse } from "next/server";
import { resetPasswordByToken, validatePassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!token) {
    return NextResponse.json({ error: "缺少重置 token" }, { status: 400 });
  }
  const passwordError = validatePassword(password);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  const user = resetPasswordByToken(token, password);
  if (!user) {
    return NextResponse.json({ error: "重置链接无效或已过期" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, user });
}
