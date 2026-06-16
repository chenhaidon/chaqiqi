import { NextRequest, NextResponse } from "next/server";
import { createPasswordReset, normalizeEmail, validateEmail, findUserForPasswordReset } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  const email = normalizeEmail(typeof body.email === "string" ? body.email : "");
  if (!validateEmail(email)) {
    return NextResponse.json({ error: "请输入有效邮箱地址" }, { status: 400 });
  }

  const user = findUserForPasswordReset(email);
  if (user) {
    const token = createPasswordReset(user.id);
    await sendPasswordResetEmail(user.email, token);
  }

  return NextResponse.json({ ok: true, message: "如果邮箱存在，我们已发送重置邮件" });
}
