"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const VERIFY_WINDOW_SECONDS = 10 * 60;

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(VERIFY_WINDOW_SECONDS);

  useEffect(() => {
    if (!registeredEmail) return;
    setRemainingSeconds(VERIFY_WINDOW_SECONDS);
    const timer = window.setInterval(() => {
      setRemainingSeconds((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [registeredEmail]);

  const progress = useMemo(() => {
    return Math.max(0, Math.min(100, (remainingSeconds / VERIFY_WINDOW_SECONDS) * 100));
  }, [remainingSeconds]);

  const minuteText = useMemo(() => {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return `${minutes}分${String(seconds).padStart(2, "0")}秒`;
  }, [remainingSeconds]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "注册失败");
      setRegisteredEmail(email);
      setMessage(json.message || "注册成功，请查收邮箱");
      setEmail("");
      setPassword("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 620, paddingTop: 60 }}>
      <div className="topbar">
        <Link href="/" className="logo" style={{ textDecoration: "none" }}>查企企</Link>
        <span className="tag">邮箱注册</span>
      </div>
      <div className="detail-section">
        <h2>{registeredEmail ? "等待邮箱验证" : "注册账号"}</h2>

        {registeredEmail ? (
          <div style={{ display: "grid", gap: 16 }}>
            {message && <div className="muted">{message}</div>}

            <div className="muted" style={{ lineHeight: 1.8 }}>
              验证邮件已发送至：{registeredEmail}<br />
              请在 <b>10 分钟内</b> 打开邮件并完成验证，验证成功后可前往 <Link href="/login">登录页</Link> 登录。
            </div>

            <div>
              <div className="muted" style={{ marginBottom: 8 }}>
                验证有效期剩余：<b>{minuteText}</b>
              </div>
              <div
                aria-label="邮箱验证剩余时间"
                style={{
                  width: "100%",
                  height: 10,
                  background: "#e5e7eb",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    background: progress > 20 ? "#2563eb" : "#f59e0b",
                    transition: "width 1s linear",
                  }}
                />
              </div>
            </div>

            {remainingSeconds === 0 && (
              <div className="error-text">验证链接已过期，请重新注册或稍后补充“重新发送验证邮件”功能。</div>
            )}
          </div>
        ) : (
          <form className="comment-form" onSubmit={submit}>
            <input type="email" placeholder="邮箱" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="密码(至少8位，包含字母和数字)" value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <div className="error-text">{error}</div>}
            {message && <div className="muted">{message}</div>}
            <button className="btn-primary" type="submit" disabled={loading}>{loading ? "提交中…" : "注册"}</button>
          </form>
        )}

        <div className="muted" style={{ marginTop: 16 }}>已有账号？<Link href="/login">去登录</Link></div>
      </div>
    </div>
  );
}
