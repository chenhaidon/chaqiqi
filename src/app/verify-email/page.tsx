import Link from "next/link";
import { redirect } from "next/navigation";
import { verifyEmailToken } from "@/lib/auth";

type VerifyEmailPageProps = {
  searchParams?: {
    token?: string;
  };
};

export default function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const token = typeof searchParams?.token === "string" ? searchParams.token.trim() : "";

  if (!token) {
    return (
      <div className="container" style={{ maxWidth: 520, paddingTop: 60 }}>
        <div className="topbar">
          <Link href="/" className="logo" style={{ textDecoration: "none" }}>查企企</Link>
          <span className="tag">邮箱验证</span>
        </div>
        <div className="detail-section">
          <h2>验证邮箱</h2>
          <div className="error-text">缺少验证参数</div>
        </div>
      </div>
    );
  }

  const user = verifyEmailToken(token);

  if (!user) {
    return (
      <div className="container" style={{ maxWidth: 520, paddingTop: 60 }}>
        <div className="topbar">
          <Link href="/" className="logo" style={{ textDecoration: "none" }}>查企企</Link>
          <span className="tag">邮箱验证</span>
        </div>
        <div className="detail-section">
          <h2>验证邮箱</h2>
          <div className="error-text">验证链接无效或已过期</div>
          <div className="muted" style={{ marginTop: 12 }}>
            请返回 <Link href="/register">注册页</Link> 重新注册，或稍后补充“重新发送验证邮件”功能。
          </div>
        </div>
      </div>
    );
  }

  redirect("/login?verified=1");
}
