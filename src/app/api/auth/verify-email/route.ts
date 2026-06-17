import { NextRequest, NextResponse } from "next/server";
import { normalizeEmail, validateEmail, verifyEmailCode } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  const email = normalizeEmail(typeof body.email === "string" ? body.email : "");
  const code = typeof body.code === "string" ? body.code.trim() : "";

  if (!validateEmail(email)) {
    return NextResponse.json({ error: "请输入有效邮箱地址" }, { status: 400 });
  }
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "请输入 6 位验证码" }, { status: 400 });
  }

  const user = verifyEmailCode(email, code);
  if (!user) {
    return NextResponse.json({ error: "验证码错误或已过期" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, user });
}
