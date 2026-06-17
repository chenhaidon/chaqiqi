"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const VERIFY_WINDOW_SECONDS = 5 * 60;

type Step = "register" | "verify" | "success";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(VERIFY_WINDOW_SECONDS);

  useEffect(() => {
    if (step !== "verify") return;
    const timer = window.setInterval(() => {
      setRemainingSeconds((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [step]);

  const progress = useMemo(() => {
    return Math.max(0, Math.min(100, (remainingSeconds / VERIFY_WINDOW_SECONDS) * 100));
  }, [remainingSeconds]);

  const minuteText = useMemo(() => {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return `${minutes}分${String(seconds).padStart(2, "0")}秒`;
  }, [remainingSeconds]);

  async function submitRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setRegisterLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "注册失败");
      setVerificationEmail(json.email || email.trim().toLowerCase());
      setCode("");
      setRemainingSeconds(typeof json.expiresInSeconds === "number" ? json.expiresInSeconds : VERIFY_WINDOW_SECONDS);
      setStep("verify");
      setMessage(json.message || "注册成功，请查收邮箱验证码");
      setEmail("");
      setPassword("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRegisterLoading(false);
    }
  }

  async function submitVerify(e: React.FormEvent) {
    e.preventDefault();
    if (remainingSeconds === 0) {
      setError("验证码已过期，请重新注册获取新验证码");
      return;
    }
    setError("");
    setMessage("");
    setVerifyLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verificationEmail, code }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "验证码校验失败");
      setStep("success");
      setMessage("邮箱验证成功，正在跳转到登录页...");
      window.setTimeout(() => {
        router.push("/login?verified=1");
      }, 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setVerifyLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 620, paddingTop: 60 }}>
      <div className="topbar">
        <Link href="/" className="logo" style={{ textDecoration: "none" }}>查企企</Link>
        <span className="tag">邮箱注册</span>
      </div>
      <div className="detail-section">
        <h2>
          {step === "register" ? "注册账号" : step === "verify" ? "输入邮箱验证码" : "邮箱验证成功"}
        </h2>

        {step === "register" && (
          <form className="comment-form" onSubmit={submitRegister}>
            <input type="email" placeholder="邮箱" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="密码(至少8位，包含字母和数字)" value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <div className="error-text">{error}</div>}
            {message && <div className="muted">{message}</div>}
            <button className="btn-primary" type="submit" disabled={registerLoading}>
              {registerLoading ? "提交中…" : "注册"}
            </button>
          </form>
        )}

        {step === "verify" && (
          <div style={{ display: "grid", gap: 16 }}>
            {message && <div className="muted">{message}</div>}
            <div className="muted" style={{ lineHeight: 1.8 }}>
              验证码已发送至：{verificationEmail}
              <br />
              请在 <b>5 分钟内</b> 返回当前页面输入 6 位验证码完成注册。
            </div>
            <form className="comment-form" onSubmit={submitVerify}>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                placeholder="请输入 6 位验证码"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
              {error && <div className="error-text">{error}</div>}
              <button className="btn-primary" type="submit" disabled={verifyLoading || remainingSeconds === 0}>
                {verifyLoading ? "验证中…" : "验证并登录"}
              </button>
            </form>
            <div>
              <div className="muted" style={{ marginBottom: 8 }}>
                验证码有效期剩余：<b>{minuteText}</b>
              </div>
              <div
                aria-label="邮箱验证码剩余时间"
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
              <div className="error-text">验证码已过期，请重新注册获取新验证码。</div>
            )}
          </div>
        )}

        {step === "success" && (
          <div style={{ display: "grid", gap: 16 }}>
            {message && <div className="success-text">{message}</div>}
            <div className="muted" style={{ lineHeight: 1.8 }}>
              验证已完成：{verificationEmail}
              <br />
              即将自动跳转到 <Link href="/login?verified=1">登录页</Link>。
            </div>
          </div>
        )}

        <div className="muted" style={{ marginTop: 16 }}>已有账号？<Link href="/login">去登录</Link></div>
      </div>
    </div>
  );
}
