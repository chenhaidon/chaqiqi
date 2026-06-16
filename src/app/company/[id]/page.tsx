"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Comment, Company, RatingSummary, User } from "@/lib/types";

function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <span className="stars" aria-label={`评分 ${value}`}>
      {"★".repeat(full)}
      {"☆".repeat(5 - full)}
    </span>
  );
}

function companyFromSearchParams(id: string, params: URLSearchParams): Company | null {
  const name = params.get("name") || "";
  if (!name) return null;
  return {
    id,
    name,
    status: params.get("status") || "未知",
    creditCode: params.get("creditCode") || "",
    legalPerson: params.get("legalPerson") || "",
    registeredCapital: params.get("registeredCapital") || "",
    establishDate: params.get("establishDate") || "",
    address: params.get("address") || "",
    businessScope: params.get("businessScope") || "",
    province: "浙江",
  };
}

export default function CompanyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = decodeURIComponent(String(params.id));

  const [company, setCompany] = useState<Company | null>(() =>
    companyFromSearchParams(id, searchParams)
  );
  const [rating, setRating] = useState<RatingSummary>({ average: 0, count: 0 });
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!company);
  const [error, setError] = useState("");

  const [content, setContent] = useState("");
  const [stars, setStars] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function loadComments() {
    fetch(`/api/company/${encodeURIComponent(id)}/comments`)
      .then((r) => r.json())
      .then((json) => setComments(json.comments || []));
  }

  function loadCurrentUser() {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((json) => setCurrentUser(json.user || null));
  }

  useEffect(() => {
    const fallbackCompany = companyFromSearchParams(id, searchParams);
    if (fallbackCompany) {
      setCompany(fallbackCompany);
      setLoading(false);
    } else {
      setLoading(true);
    }

    fetch(`/api/company/${encodeURIComponent(id)}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error || "加载失败");
        return json;
      })
      .then((json) => {
        if (json.company) setCompany(json.company);
        if (json.rating) setRating(json.rating);
      })
      .catch((e) => {
        if (!fallbackCompany) setError(e.message);
      })
      .finally(() => setLoading(false));

    loadComments();
    loadCurrentUser();
  }, [id, searchParams]);

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!currentUser) {
      setFormError("请先登录后再发表评论");
      return;
    }
    if (!content.trim()) {
      setFormError("评论内容不能为空");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/company/${encodeURIComponent(id)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, rating: stars }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "提交失败");
      setContent("");
      setStars(5);
      loadComments();
      fetch(`/api/company/${encodeURIComponent(id)}`)
        .then((r) => r.json())
        .then((j) => j.rating && setRating(j.rating));
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="loading">加载中…</div>;
  if (error)
    return (
      <div className="container">
        <div className="error-text" style={{ padding: 24 }}>{error}</div>
        <Link href="/" className="back-link">← 返回首页</Link>
      </div>
    );
  if (!company) return null;

  return (
    <>
      <div className="topbar">
        <Link href="/" className="logo" style={{ textDecoration: "none" }}>
          查企企
        </Link>
        <span className="tag">浙江省企业信息查询</span>
      </div>

      <div className="container">
        <a href="#" className="back-link" onClick={(e) => { e.preventDefault(); history.back(); }}>
          ← 返回结果
        </a>

        <section className="detail-section">
          <h2>{company.name}</h2>
          <div>
            <span className={`badge ${["存续", "在业", "正常"].some((s) => company.status.includes(s)) ? "ok" : "other"}`}>
              {company.status}
            </span>
            <span style={{ marginLeft: 12 }} className="muted">
              <Stars value={rating.average} /> {rating.average || "暂无"}
              （{rating.count} 条评价）
            </span>
          </div>

          <table className="detail-table">
            <tbody>
              <tr><th>统一社会信用代码</th><td>{company.creditCode || "—"}</td></tr>
              <tr><th>法定代表人</th><td>{company.legalPerson || "—"}</td></tr>
              <tr><th>注册资本</th><td>{company.registeredCapital || "—"}</td></tr>
              <tr><th>成立日期</th><td>{company.establishDate || "—"}</td></tr>
              <tr><th>注册状态</th><td>{company.status || "—"}</td></tr>
              <tr><th>注册地址</th><td>{company.address || "—"}</td></tr>
              <tr><th>经营范围</th><td>{company.businessScope || "—"}</td></tr>
            </tbody>
          </table>
        </section>

        <section className="detail-section">
          <h2 style={{ fontSize: "1.2rem" }}>用户评价 · 打分</h2>

          {!currentUser && (
            <div className="muted" style={{ marginBottom: 16 }}>
              请先 <Link href="/login">登录</Link> 后再发表评论。
            </div>
          )}

          <form className="comment-form" onSubmit={submitComment}>
            <div className="star-input" role="radiogroup" aria-label="评分">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  type="button"
                  key={n}
                  className={n <= stars ? "active" : ""}
                  onClick={() => setStars(n)}
                  aria-label={`${n} 星`}
                >
                  ★
                </button>
              ))}
              <span className="muted" style={{ fontSize: "0.85rem", marginLeft: 8 }}>
                {stars} 星
              </span>
            </div>
            {currentUser && (
              <div className="muted" style={{ marginTop: -4, marginBottom: 6 }}>当前账号：{currentUser.email}</div>
            )}
            <textarea
              placeholder="写下你对这家企业的评价…(不超过 500 字)"
              value={content}
              maxLength={500}
              onChange={(e) => setContent(e.target.value)}
              disabled={!currentUser}
            />
            {formError && <div className="error-text">{formError}</div>}
            <button className="btn-primary" type="submit" disabled={submitting || !currentUser}>
              {submitting ? "提交中…" : "发表评价"}
            </button>
          </form>

          <div style={{ marginTop: 20 }}>
            {comments.length === 0 && (
              <div className="muted">还没有评价,来做第一个吧。</div>
            )}
            {comments.map((c) => (
              <div className="comment" key={c.id}>
                <div className="head">
                  <span>
                    <b style={{ color: "var(--text)" }}>{c.author}</b>{" "}
                    <Stars value={c.rating} />
                  </span>
                  <span>{c.createdAt}</span>
                </div>
                <div className="body">{c.content}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
