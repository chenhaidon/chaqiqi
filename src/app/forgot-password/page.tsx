"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "发送失败");
      setMessage(json.message || "如果邮箱存在，我们已发送重置邮件");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 520, paddingTop: 60 }}>
      <div className="topbar">
        <Link href="/" className="logo" style={{ textDecoration: "none" }}>查企企</Link>
        <span className="tag">找回密码</span>
      </div>
      <div className="detail-section">
        <h2>忘记密码</h2>
        <form className="comment-form" onSubmit={submit}>
          <input type="email" placeholder="邮箱" value={email} onChange={(e) => setEmail(e.target.value)} />
          {error && <div className="error-text">{error}</div>}
          {message && <div className="muted">{message}</div>}
          <button className="btn-primary" type="submit" disabled={loading}>{loading ? "发送中…" : "发送重置邮件"}</button>
        </form>
      </div>
    </div>
  );
}
