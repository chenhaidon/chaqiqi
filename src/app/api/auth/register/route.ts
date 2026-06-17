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
      const code = createEmailVerification(existingUser.id);
      await sendVerificationEmail(existingUser.email, code);
      return NextResponse.json({
        ok: true,
        email: existingUser.email,
        expiresInSeconds: 300,
        message: "该邮箱尚未完成验证，已重新发送验证码",
      });
    }

    const user = createUser(email, hashPassword(password));
    const code = createEmailVerification(user.id);
    await sendVerificationEmail(user.email, code);
    return NextResponse.json(
      {
        ok: true,
        email: user.email,
        expiresInSeconds: 300,
        message: "注册成功，请查收邮箱验证码",
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "注册失败" }, { status: 500 });
  }
}
