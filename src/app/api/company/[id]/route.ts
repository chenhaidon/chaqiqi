import { NextRequest, NextResponse } from "next/server";
import { getCompany } from "@/lib/dataProvider";
import { getRatingSummary } from "@/lib/comments";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = decodeURIComponent(params.id);
  const rating = getRatingSummary(id);

  try {
    const company = await getCompany(id);
    if (!company) {
      return NextResponse.json({ company: null, rating, detailError: "未找到该企业" }, { status: 404 });
    }
    return NextResponse.json({ company, rating });
  } catch (err: any) {
    return NextResponse.json(
      { company: null, rating, detailError: err?.message || "查询失败" },
      { status: 200 }
    );
  }
}
