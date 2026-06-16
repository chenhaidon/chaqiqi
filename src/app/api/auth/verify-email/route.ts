import { NextRequest, NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token) {
    return NextResponse.json({ error: "缺少验证 token" }, { status: 400 });
  }

  const user = verifyEmailToken(token);
  if (!user) {
    return NextResponse.json({ error: "验证链接无效或已过期" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, user });
}
