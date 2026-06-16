"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { Company, SearchResult } from "@/lib/types";

const PAGE_SIZE = 10;

function statusBadge(status: string) {
  const ok = ["存续", "在业", "正常"].some((s) => status.includes(s));
  return <span className={`badge ${ok ? "ok" : "other"}`}>{status}</span>;
}

function SearchInner() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") || "";

  const [input, setInput] = useState(q);
  const [data, setData] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setInput(q);
    if (!q) return;
    setLoading(true);
    setError("");
    fetch(`/api/search?q=${encodeURIComponent(q)}&page=1&pageSize=${PAGE_SIZE}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error || "查询失败");
        return json;
      })
      .then((json: SearchResult) => setData(json))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [q]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const kw = input.trim();
    if (!kw) return;
    router.push(`/search?q=${encodeURIComponent(kw)}`);
  }

  return (
    <>
      <div className="topbar">
        <Link href="/" className="logo" style={{ textDecoration: "none" }}>
          查企企
        </Link>
        <span className="tag">浙江省企业信息查询</span>
      </div>

      <div className="container">
        <form className="search-box" onSubmit={submit} style={{ maxWidth: "100%" }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入企业名称 / 统一社会信用代码 / 法定代表人"
            aria-label="企业查询关键词"
          />
          <button type="submit">查询</button>
        </form>

        {loading && <div className="loading">查询中…</div>}
        {error && <div className="error-text" style={{ padding: "16px 0" }}>{error}</div>}

        {!loading && !error && data && (
          <>
            <div className="results-header">
              关键词「{q}」的最佳匹配结果
            </div>

            {data.items.length === 0 && (
              <div className="card muted">未找到匹配的浙江省企业,换个关键词试试。</div>
            )}

            {data.items.map((c: Company) => (
              <Link
                key={c.id}
                href={{
                  pathname: `/company/${encodeURIComponent(c.id)}`,
                  query: {
                    name: c.name,
                    status: c.status,
                    creditCode: c.creditCode,
                    legalPerson: c.legalPerson,
                    registeredCapital: c.registeredCapital,
                    establishDate: c.establishDate,
                    address: c.address,
                    businessScope: c.businessScope,
                  },
                }}
              >
                <div className="card">
                  <div className="name">
                    {c.name}
                    {statusBadge(c.status)}
                  </div>
                  <div className="meta-grid">
                    <div>
                      <span className="label">法定代表人:</span> {c.legalPerson || "—"}
                    </div>
                    <div>
                      <span className="label">注册资本:</span> {c.registeredCapital || "—"}
                    </div>
                    <div>
                      <span className="label">成立日期:</span> {c.establishDate || "—"}
                    </div>
                    <div>
                      <span className="label">信用代码:</span> {c.creditCode || "—"}
                    </div>
                  </div>
                  <div className="scope">
                    <span className="label">经营范围:</span> {c.businessScope || "—"}
                  </div>
                </div>
              </Link>
            ))}
          </>
        )}
      </div>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="loading">加载中…</div>}>
      <SearchInner />
    </Suspense>
  );
}
