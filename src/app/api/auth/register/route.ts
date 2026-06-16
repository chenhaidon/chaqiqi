import { NextRequest, NextResponse } from "next/server";
import { createUser, getUserByEmail, refreshUnverifiedUser } from "@/lib/authRepo";
import {
  createEmailVerification,
  hashPassword,
  normalizeEmail,
  validateEmail,
  validatePassword,
} from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/mailer";

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

  if (!validateEmail(email)) {
    return NextResponse.json({ error: "请输入有效邮箱地址" }, { status: 400 });
  }
  const passwordError = validatePassword(password);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  try {
    const existingUser = getUserByEmail(email);
    if (existingUser) {
      if (existingUser.emailVerified) {
        return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
      }
      refreshUnverifiedUser(existingUser.id, hashPassword(password));
      const token = createEmailVerification(existingUser.id);
      await sendVerificationEmail(existingUser.email, token);
      return NextResponse.json({ ok: true, message: "该邮箱尚未完成验证，已重新发送验证邮件" });
    }

    const user = createUser(email, hashPassword(password));
    const token = createEmailVerification(user.id);
    await sendVerificationEmail(user.email, token);
    return NextResponse.json({ ok: true, message: "注册成功，请查收验证邮件" }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "注册失败" }, { status: 500 });
  }
}
