"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ModerationItem = {
  id: number;
  target: "company_image" | "comment_image";
  companyId: string;
  fileUrl: string;
  createdAt: string;
};

export default function ModerationPage() {
  const router = useRouter();
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  function loadItems() {
    setLoading(true);
    fetch("/api/admin/moderation", { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json();
        if (res.status === 403) {
          setForbidden(true);
          throw new Error(json.error || "无权访问审核后台");
        }
        if (!res.ok) throw new Error(json.error || "加载审核队列失败");
        setForbidden(false);
        setItems(json.items || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function moderate(target: ModerationItem["target"], id: number, action: "approve" | "reject") {
    setError("");
    setActionLoading(true);
    const res = await fetch("/api/admin/moderation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target, id, action }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "审核操作失败");
      setActionLoading(false);
      return;
    }
    loadItems();
    setActionLoading(false);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  if (loading) return <div className="loading">加载中…</div>;

  return (
    <div className="container" style={{ maxWidth: 960, paddingTop: 60, paddingBottom: 40 }}>
      <div className="topbar">
        <Link href="/" className="logo" style={{ textDecoration: "none" }}>查企企</Link>
        <span className="tag">图片审核后台</span>
      </div>
      <div className="detail-section">
        <div className="user-section-head">
          <h2>审核工作台</h2>
          <p className="user-helper-text">集中处理企业相册与评论图片的待审核内容。</p>
        </div>

        {forbidden ? (
          <div>
            {error && <div className="error-text">{error}</div>}
            <div className="muted" style={{ marginTop: 10 }}>请先使用管理员账号登录后再进入审核后台。</div>
            <div style={{ marginTop: 16 }}>
              <Link href="/admin/login" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                前往后台登录
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="moderation-toolbar">
              <div className="muted">当前共有 {items.length} 条待审核图片</div>
              <button type="button" className="btn-secondary" onClick={logout}>退出后台</button>
            </div>
            {error && <div className="error-text">{error}</div>}
            {items.length === 0 ? (
              <div className="muted">当前没有待审核图片。</div>
            ) : (
              <div className="moderation-grid">
                {items.map((item) => (
                  <div className="moderation-card" key={`${item.target}-${item.id}`}>
                    <img src={item.fileUrl} alt="待审核图片" className="moderation-image" />
                    <div className="muted">类型：{item.target === "company_image" ? "企业相册" : "评论图片"}</div>
                    <div className="muted">企业 ID：{item.companyId}</div>
                    <div className="muted">提交时间：{item.createdAt}</div>
                    <div className="moderation-actions">
                      <button className="btn-primary" type="button" disabled={actionLoading} onClick={() => moderate(item.target, item.id, "approve")}>批准</button>
                      <button className="btn-danger" type="button" disabled={actionLoading} onClick={() => moderate(item.target, item.id, "reject")}>驳回</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
