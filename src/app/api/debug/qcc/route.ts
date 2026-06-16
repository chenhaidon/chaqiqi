import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// 诊断接口：直接透传企查查原始响应，用于调试接口路径和鉴权。
// 访问：GET /api/debug/qcc?path=/FuzzySearch/GetList&searchKey=阿里巴巴&pageIndex=1
// 默认仅在显式启用时开放。

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (process.env.ENABLE_QCC_DEBUG_API !== "true") {
    return NextResponse.json({ error: "未开启调试接口" }, { status: 404 });
  }

  const KEY = process.env.QCC_KEY || "";
  const SECRET = process.env.QCC_SECRET_KEY || "";
  const BASE_URL = process.env.QCC_BASE_URL || "https://api.qichacha.com";

  const { searchParams } = new URL(req.url);
  const pathName = searchParams.get("path") || "/FuzzySearch/GetList";

  const timespan = Math.floor(Date.now() / 1000).toString();
  const token = crypto
    .createHash("md5")
    .update(KEY + timespan + SECRET)
    .digest("hex")
    .toUpperCase();

  const url = new URL(pathName, BASE_URL);
  url.searchParams.set("key", KEY);
  for (const [k, v] of searchParams.entries()) {
    if (k !== "path") url.searchParams.set(k, v);
  }

  const fullUrl = url.toString();

  let status = 0;
  let body = "";
  try {
    const res = await fetch(fullUrl, {
      method: "GET",
      headers: { Token: token, Timespan: timespan },
    });
    status = res.status;
    body = await res.text();
  } catch (e: any) {
    body = `fetch 失败: ${e.message}`;
  }

  return NextResponse.json({
    requestUrl: fullUrl.replace(KEY, "***"),
    httpStatus: status,
    response: (() => { try { return JSON.parse(body); } catch { return body; } })(),
  });
}
