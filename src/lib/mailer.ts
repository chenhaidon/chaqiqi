import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.qq.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "465", 10);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;
const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:3000";
const EMAIL_VERIFY_WINDOW_TEXT = "5 分钟";

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

function ensureMailerConfig() {
  if (!SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    throw new Error("SMTP 配置不完整");
  }
}

export async function sendVerificationEmail(email: string, code: string): Promise<void> {
  ensureMailerConfig();
  await transporter.sendMail({
    from: SMTP_FROM,
    to: email,
    subject: "查企企 - 邮箱验证",
    html: `<p>欢迎注册查企企。</p><p>你的邮箱验证码是：</p><p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">${code}</p><p>请在 ${EMAIL_VERIFY_WINDOW_TEXT} 内返回注册页输入该验证码完成注册。</p><p>若非本人操作，请忽略此邮件。</p>`,
    text: `欢迎注册查企企，你的邮箱验证码是：${code}。请在 ${EMAIL_VERIFY_WINDOW_TEXT} 内返回注册页输入该验证码完成注册。若非本人操作，请忽略此邮件。`,
  });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  ensureMailerConfig();
  const url = `${APP_BASE_URL}/reset-password?token=${encodeURIComponent(token)}`;
  await transporter.sendMail({
    from: SMTP_FROM,
    to: email,
    subject: "查企企 - 重置密码",
    html: `<p>我们收到了你的重置密码请求。</p><p>请点击下面链接设置新密码：</p><p><a href="${url}">${url}</a></p><p>链接 30 分钟内有效。</p>`,
    text: `请访问以下链接重置密码：${url}`,
  });
}
