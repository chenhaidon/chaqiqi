"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "管理员登录失败");
      router.push("/admin/moderation");
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
        <span className="tag">审核后台登录</span>
      </div>
      <div className="detail-section">
        <h2>管理员登录</h2>
        <div className="muted" style={{ marginBottom: 12 }}>使用管理员账号进入图片审核后台。</div>
        <form className="comment-form" onSubmit={submit}>
          <input type="text" placeholder="管理员账号" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input type="password" placeholder="管理员密码" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <div className="error-text">{error}</div>}
          <button className="btn-primary" type="submit" disabled={loading}>{loading ? "登录中…" : "进入后台"}</button>
        </form>
      </div>
    </div>
  );
}
