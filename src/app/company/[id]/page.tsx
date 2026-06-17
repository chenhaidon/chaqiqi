"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Comment, Company, ImageAsset, RatingSummary, User } from "@/lib/types";

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
  const [galleryImages, setGalleryImages] = useState<ImageAsset[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!company);
  const [error, setError] = useState("");

  const [content, setContent] = useState("");
  const [stars, setStars] = useState(5);
  const [commentImages, setCommentImages] = useState<File[]>([]);
  const [companyImages, setCompanyImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingCompanyImages, setUploadingCompanyImages] = useState(false);
  const [formError, setFormError] = useState("");
  const [galleryMessage, setGalleryMessage] = useState("");
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerMode, setViewerMode] = useState<"company" | "comment">("company");
  const [viewerOpen, setViewerOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  function loadComments() {
    fetch(`/api/company/${encodeURIComponent(id)}/comments`)
      .then((r) => r.json())
      .then((json) => setComments(json.comments || []));
  }

  function loadGalleryImages() {
    fetch(`/api/company/${encodeURIComponent(id)}/images`)
      .then((r) => r.json())
      .then((json) => setGalleryImages(json.images || []));
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
    loadGalleryImages();
    loadCurrentUser();
  }, [id, searchParams]);

  function openViewer(urls: string[], startIndex = 0, mode: "company" | "comment" = "company") {
    setViewerImages(urls);
    setViewerIndex(startIndex);
    setViewerMode(mode);
    setViewerOpen(true);
  }

  function closeViewer() {
    setViewerOpen(false);
    setViewerImages([]);
    setViewerIndex(0);
    setViewerMode("company");
  }

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
      const formData = new FormData();
      formData.append("content", content);
      formData.append("rating", String(stars));
      for (const file of commentImages) {
        formData.append("images", file);
      }

      const res = await fetch(`/api/company/${encodeURIComponent(id)}/comments`, {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "提交失败");
      setContent("");
      setStars(5);
      setCommentImages([]);
      setFormError(json.message || "");
      setReviewModalOpen(false);
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

  async function uploadCompanyGallery(filesOverride?: File[], e?: React.FormEvent) {
    e?.preventDefault();
    setGalleryMessage("");
    if (!currentUser) {
      setGalleryMessage("请先登录后再上传企业图片");
      return;
    }
    const files = filesOverride ?? companyImages;
    if (files.length === 0) {
      setGalleryMessage("请选择至少一张企业图片");
      return;
    }
    setUploadingCompanyImages(true);
    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append("files", file);
      }
      const res = await fetch(`/api/company/${encodeURIComponent(id)}/images`, {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "上传失败");
      setCompanyImages([]);
      setGalleryMessage(json.message || "企业图片已提交，审核通过后展示");
      loadGalleryImages();
    } catch (err: any) {
      setGalleryMessage(err.message);
    } finally {
      setUploadingCompanyImages(false);
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
          <div className="company-hero">
            <div className="company-hero-main">
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
            </div>

            <button
              type="button"
              className={`album-thumb ${galleryImages.length === 0 ? "is-empty" : ""}`}
              onClick={() => openViewer(galleryImages.map((item) => item.fileUrl), 0, "company")}
              aria-label={galleryImages.length > 0 ? `打开企业相册，共 ${galleryImages.length} 张` : "打开企业相册并上传图片"}
            >
              <span className="album-thumb-back" />
              <span className="album-thumb-middle" />
              <span className="album-thumb-front">
                {galleryImages[0] ? <img src={galleryImages[0].fileUrl} alt="企业相册封面" /> : <span className="album-thumb-plus">+</span>}
              </span>
              {galleryImages.length > 0 && <span className="album-thumb-count">{galleryImages.length}</span>}
            </button>
          </div>

          {!currentUser && (
            <div className="muted" style={{ marginTop: 12 }}>
              请先 <Link href="/login">登录</Link> 后上传企业图片。
            </div>
          )}
          {galleryMessage && <div className={galleryMessage.includes("失败") || galleryMessage.includes("请先") || galleryMessage.includes("请选择") ? "error-text" : "success-text"}>{galleryMessage}</div>}

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

        <section className="detail-section review-section">
          <div className="review-section-head">
            <div className="review-section-title-row">
              <h2 style={{ fontSize: "1.2rem" }}>用户评价 · 打分</h2>
              <div className="review-summary-bar">
                <span><Stars value={rating.average} /> {rating.average || "暂无"}</span>
                <span>{rating.count} 条评价</span>
              </div>
            </div>
            <p className="user-helper-text review-intro">分享你与这家企业合作、面试或服务体验，帮助其他用户更快了解这家企业。</p>
          </div>

          <div className="review-composer-trigger">
            {!currentUser ? (
              <div className="review-login-tip">
                请先 <Link href="/login">登录</Link> 后再发表评论。
              </div>
            ) : (
              <div className="review-entry-card">
                <div>
                  <div className="review-entry-title">写下你的评价</div>
                  <div className="user-helper-text">支持评分、文字和最多 3 张图片，评论图片需审核通过后展示。</div>
                </div>
                <button type="button" className="btn-primary" onClick={() => { setFormError(""); setReviewModalOpen(true); }}>
                  发表评论
                </button>
              </div>
            )}
            {formError && !reviewModalOpen && <div className={formError.includes("已发表") ? "success-text" : "error-text"}>{formError}</div>}
          </div>

          <div className="review-list">
            {comments.length === 0 && (
              <div className="review-empty">
                <div className="review-empty-title">暂无评价</div>
                <div className="user-helper-text">成为第一位分享体验的用户。</div>
              </div>
            )}
            {comments.map((c) => (
              <div className="comment review-card" key={c.id}>
                <div className="head review-card-head">
                  <div className="review-card-author">
                    <b style={{ color: "var(--text)" }}>{c.author}</b>
                    <span className="review-card-rating"><Stars value={c.rating} /></span>
                  </div>
                  <span className="review-card-time">{c.createdAt}</span>
                </div>
                <div className="body review-card-body">{c.content}</div>
                {!!c.images?.length && (
                  <div className="comment-image-row review-card-images">
                    {c.images.map((image, index) => (
                      <button
                        type="button"
                        key={image.id}
                        className="comment-image-thumb"
                        onClick={() => openViewer((c.images || []).map((item) => item.fileUrl), index, "comment")}
                      >
                        <img src={image.fileUrl} alt="评论图片" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {reviewModalOpen && (
        <div className="image-viewer-overlay" onClick={() => setReviewModalOpen(false)}>
          <div className="image-viewer-panel review-modal-panel" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="image-viewer-close" onClick={() => setReviewModalOpen(false)}>关闭</button>
            <div className="image-viewer-content review-modal-content">
              <div className="review-modal-head">
                <h3>发表评论</h3>
                <div className="user-helper-text">当前账号：{currentUser?.email}</div>
              </div>
              <form className="comment-form user-form review-form review-modal-form" onSubmit={submitComment}>
                <div className="user-field-group review-rating-group">
                  <label className="user-field-label">评分</label>
                  <div className="star-input review-star-input" role="radiogroup" aria-label="评分">
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
                    <span className="muted review-score-text">{stars} 星</span>
                  </div>
                </div>

                <div className="user-field-group">
                  <label className="user-field-label">评价内容</label>
                  <textarea
                    placeholder="写下你对这家企业的评价…(不超过 500 字)"
                    value={content}
                    maxLength={500}
                    onChange={(e) => setContent(e.target.value)}
                  />
                  <div className="user-helper-text">最多 500 字，尽量描述真实体验与具体感受。</div>
                </div>

                <div className="user-field-group review-upload-panel">
                  <label className="user-field-label">评论图片</label>
                  <label className="upload-label user-upload-label review-upload-label">
                    <span>选择图片（最多 3 张）</span>
                    <input
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={(e) => setCommentImages(Array.from(e.target.files || []).slice(0, 3))}
                    />
                  </label>
                  <div className="user-helper-text">已选择 {commentImages.length} / 3 张，评论图片需审核通过后展示。</div>
                </div>

                {formError && <div className={formError.includes("已发表") ? "success-text" : "error-text"}>{formError}</div>}

                <div className="user-action-row review-action-row review-modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setReviewModalOpen(false)}>取消</button>
                  <button className="btn-primary" type="submit" disabled={submitting}>
                    {submitting ? "提交中…" : "发表评价"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {viewerOpen && (
        <div className="image-viewer-overlay" onClick={closeViewer}>
          <div className="image-viewer-panel" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="image-viewer-close" onClick={closeViewer}>关闭</button>
            {viewerImages.length > 1 && (
              <button
                type="button"
                className="image-viewer-nav image-viewer-prev"
                onClick={() => setViewerIndex((value) => (value === 0 ? viewerImages.length - 1 : value - 1))}
              >
                ‹
              </button>
            )}
            <div className="image-viewer-content">
              {viewerImages.length > 0 ? (
                <img src={viewerImages[viewerIndex]} alt="查看图片" className="image-viewer-image" />
              ) : (
                <div className="image-viewer-image image-viewer-empty">暂无图片，点击下方加号上传</div>
              )}
              {viewerMode === "company" && (
                <div className="viewer-upload-strip">
                  {viewerImages.map((url, index) => (
                    <button type="button" key={`${url}-${index}`} className={`viewer-strip-thumb ${index === viewerIndex ? "active" : ""}`} onClick={() => setViewerIndex(index)}>
                      <img src={url} alt="企业相册缩略图" />
                    </button>
                  ))}
                  <label className="viewer-strip-add">
                    <span>{uploadingCompanyImages ? "上传中…" : "+"}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      disabled={uploadingCompanyImages}
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        setCompanyImages(files);
                        if (files.length > 0) {
                          await uploadCompanyGallery(files);
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              )}
              {viewerMode === "company" && galleryMessage && (
                <div className={galleryMessage.includes("失败") || galleryMessage.includes("请先") || galleryMessage.includes("请选择") ? "error-text" : "success-text"}>
                  {galleryMessage}
                </div>
              )}
            </div>
            {viewerImages.length > 1 && (
              <button
                type="button"
                className="image-viewer-nav image-viewer-next"
                onClick={() => setViewerIndex((value) => (value === viewerImages.length - 1 ? 0 : value + 1))}
              >
                ›
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
