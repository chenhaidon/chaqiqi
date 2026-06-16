"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function ResetPasswordInner() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "重置失败");
      setMessage("密码已重置，请使用新密码登录。");
      setPassword("");
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
        <span className="tag">重置密码</span>
      </div>
      <div className="detail-section">
        <h2>设置新密码</h2>
        <form className="comment-form" onSubmit={submit}>
          <input type="password" placeholder="新密码(至少8位，包含字母和数字)" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <div className="error-text">{error}</div>}
          {message && <div className="muted">{message}</div>}
          <button className="btn-primary" type="submit" disabled={loading || !token}>{loading ? "提交中…" : "重置密码"}</button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="loading">加载中…</div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}
