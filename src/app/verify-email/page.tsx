import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="container" style={{ maxWidth: 520, paddingTop: 60 }}>
      <div className="topbar">
        <Link href="/" className="logo" style={{ textDecoration: "none" }}>查企企</Link>
        <span className="tag">邮箱验证</span>
      </div>
      <div className="detail-section">
        <h2>验证方式已更新</h2>
        <div className="muted" style={{ lineHeight: 1.8 }}>
          当前注册流程已改为邮箱验证码验证。
          <br />
          请返回 <Link href="/register">注册页</Link>，注册后在页面内输入 5 分钟内收到的 6 位验证码完成验证。
        </div>
      </div>
    </div>
  );
}
