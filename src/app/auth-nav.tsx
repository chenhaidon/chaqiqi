"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function formatLabel(label: string): string {
  return label.length > 24 ? `${label.slice(0, 24)}…` : label;
}

export default function AuthNav() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; nickname?: string; avatarUrl?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) {
          setUser(json.user || null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.refresh();
      router.push("/");
    } finally {
      setLoggingOut(false);
    }
  }

  if (loading) {
    return <div className="auth-nav" />;
  }

  if (!user) {
    return (
      <div className="auth-nav">
        <Link href="/login">登录</Link>
        <Link href="/register">注册</Link>
      </div>
    );
  }

  return (
    <div className="auth-nav">
      <Link href="/user" className="auth-user" title={user.nickname || user.email}>
        {user.avatarUrl ? <img src={user.avatarUrl} alt="头像" className="auth-avatar" /> : null}
        <span>{formatLabel(user.nickname || user.email)}</span>
      </Link>
      <button type="button" className="auth-logout" onClick={logout} disabled={loggingOut}>
        {loggingOut ? "退出中…" : "退出"}
      </button>
    </div>
  );
}
