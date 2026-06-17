"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email: string;
  nickname: string;
  avatarUrl: string;
};

export default function UserPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [nickname, setNickname] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (!json.user) {
          router.replace("/login");
          return;
        }
        setUser(json.user);
        setNickname(json.user.nickname || "");
      })
      .catch(() => {
        if (!cancelled) router.replace("/login");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileError("");
    setProfileMessage("");
    setProfileLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, avatarUrl: user?.avatarUrl || "" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "保存失败");
      setUser(json.user);
      setNickname(json.user.nickname || "");
      setProfileMessage("资料已保存");
      router.refresh();
    } catch (err: any) {
      setProfileError(err.message);
    } finally {
      setProfileLoading(false);
    }
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileError("");
    setProfileMessage("");
    setAvatarLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "头像上传失败");
      setUser(json.user);
      setProfileMessage("头像已更新");
      router.refresh();
    } catch (err: any) {
      setProfileError(err.message);
    } finally {
      setAvatarLoading(false);
      e.target.value = "";
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordMessage("");
    if (newPassword !== confirmPassword) {
      setPasswordError("两次输入的新密码不一致");
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "修改密码失败");
      setPasswordMessage(json.message || "密码已修改，请重新登录");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      window.setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  }

  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setDeleteError("");
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/user/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "注销账号失败");
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (loading) return <div className="loading">加载中…</div>;
  if (!user) return null;

  return (
    <div className="container user-page">
      <div className="topbar">
        <Link href="/" className="logo" style={{ textDecoration: "none" }}>查企企</Link>
        <span className="tag">用户中心</span>
      </div>

      <div className="user-page-heading">
        <h1>个人中心</h1>
        <p>管理你的头像、昵称、密码与账号安全。</p>
      </div>

      <div className="detail-section user-hero-card">
        <div className="user-hero">
          <div className="user-hero-avatar">
            <div className="avatar-preview user-avatar-large">
              {user.avatarUrl ? <img src={user.avatarUrl} alt="头像" className="avatar-image" /> : <span>无头像</span>}
            </div>
          </div>

          <div className="user-hero-body">
            <div className="user-hero-meta">
              <span className="user-chip">账号资料</span>
              <h2>{nickname || "未设置昵称"}</h2>
              <div className="muted">登录邮箱：{user.email}</div>
              <p className="user-helper-text">你可以在这里维护头像和昵称，公开展示会优先使用昵称。</p>
            </div>

            <form className="comment-form user-form" onSubmit={saveProfile}>
              <div className="user-field-group">
                <label className="user-field-label" htmlFor="nickname">昵称</label>
                <input id="nickname" type="text" placeholder="请输入昵称" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={20} />
              </div>

              <div className="user-action-row">
                <label className="upload-label user-upload-label">
                  <span>{avatarLoading ? "上传中…" : "上传头像"}</span>
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={uploadAvatar} disabled={avatarLoading} />
                </label>
                <button className="btn-primary" type="submit" disabled={profileLoading}>{profileLoading ? "保存中…" : "保存资料"}</button>
              </div>

              {profileError && <div className="error-text">{profileError}</div>}
              {profileMessage && <div className="success-text">{profileMessage}</div>}
            </form>
          </div>
        </div>
      </div>

      <div className="detail-section user-settings-card">
        <div className="user-section-head">
          <h2>密码安全</h2>
          <p className="user-helper-text">定期更新密码可以提升账号安全性。</p>
        </div>
        <form className="comment-form user-form" onSubmit={changePassword}>
          <div className="user-field-group">
            <label className="user-field-label" htmlFor="current-password">当前密码</label>
            <input id="current-password" type="password" placeholder="请输入当前密码" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="user-field-group">
            <label className="user-field-label" htmlFor="new-password">新密码</label>
            <input id="new-password" type="password" placeholder="请输入新密码" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <div className="user-helper-text">至少 8 位，且同时包含字母和数字。</div>
          </div>
          <div className="user-field-group">
            <label className="user-field-label" htmlFor="confirm-password">确认新密码</label>
            <input id="confirm-password" type="password" placeholder="请再次输入新密码" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          {passwordError && <div className="error-text">{passwordError}</div>}
          {passwordMessage && <div className="success-text">{passwordMessage}</div>}
          <div className="user-action-row">
            <button className="btn-primary" type="submit" disabled={passwordLoading}>{passwordLoading ? "提交中…" : "修改密码"}</button>
          </div>
        </form>
      </div>

      <div className="detail-section danger-section user-settings-card">
        <div className="user-section-head">
          <h2>账号操作</h2>
          <p className="user-helper-text">退出当前会话，或永久注销你的账号。</p>
        </div>
        <div className="danger-actions user-danger-layout">
          <div className="user-danger-panel">
            <div>
              <div className="user-danger-title">退出登录</div>
              <div className="user-helper-text">退出当前设备的登录状态，不会删除账号资料。</div>
            </div>
            <button type="button" className="btn-secondary" onClick={logout}>退出登录</button>
          </div>

          <div className="user-danger-panel user-danger-panel-critical">
            <div>
              <div className="user-danger-title">注销账号</div>
              <div className="user-helper-text">此操作不可恢复，将永久删除你的账号及相关登录信息。</div>
            </div>
            <form className="comment-form user-form" onSubmit={deleteAccount}>
              <div className="user-field-group">
                <label className="user-field-label" htmlFor="delete-password">确认当前密码</label>
                <input id="delete-password" type="password" placeholder="输入当前密码以确认注销账号" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} />
              </div>
              {deleteError && <div className="error-text">{deleteError}</div>}
              <div className="user-action-row">
                <button className="btn-danger" type="submit" disabled={deleteLoading}>{deleteLoading ? "注销中…" : "注销账号"}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
