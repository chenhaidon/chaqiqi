import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ error: "该接口已停用，请使用邮箱验证码完成验证" }, { status: 410 });
}
