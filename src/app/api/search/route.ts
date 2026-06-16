import { NextRequest, NextResponse } from "next/server";
import { searchCompanies } from "@/lib/dataProvider";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const keyword = (searchParams.get("q") || "").trim();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10) || 10)
  );

  if (!keyword) {
    return NextResponse.json(
      { error: "请输入查询关键词" },
      { status: 400 }
    );
  }

  try {
    const result = await searchCompanies(keyword, page, pageSize);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "查询失败" },
      { status: 502 }
    );
  }
}
