"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "登录失败");
      router.push("/");
      router.refresh();
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
        <span className="tag">邮箱登录</span>
      </div>
      <div className="detail-section">
        <h2>登录账号</h2>
        {verified && <div className="muted" style={{ marginBottom: 12 }}>邮箱验证成功，请登录。</div>}
        <form className="comment-form" onSubmit={submit}>
          <input type="email" placeholder="邮箱" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="密码" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <div className="error-text">{error}</div>}
          <button className="btn-primary" type="submit" disabled={loading}>{loading ? "登录中…" : "登录"}</button>
        </form>
        <div className="muted" style={{ marginTop: 16 }}>
          <Link href="/forgot-password">忘记密码？</Link>
        </div>
        <div className="muted" style={{ marginTop: 8 }}>没有账号？<Link href="/register">去注册</Link></div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="loading">加载中…</div>}>
      <LoginInner />
    </Suspense>
  );
}
