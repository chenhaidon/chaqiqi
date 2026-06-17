import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin";
import { listPendingModerationItems, moderateImage, type ModerationTarget } from "@/lib/images";

export const dynamic = "force-dynamic";

export async function GET() {
  const adminUser = requireAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "无权访问审核后台，请先使用管理员账号登录" }, { status: 403 });
  }
  return NextResponse.json({ items: listPendingModerationItems() });
}

export async function POST(req: NextRequest) {
  const adminUser = requireAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: "无权执行审核操作，请重新登录管理员账号" }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  const target = body.target as ModerationTarget;
  const id = Number(body.id);
  const action = body.action === "approve" ? "approved" : body.action === "reject" ? "rejected" : "";

  if (!["company_image", "comment_image"].includes(target) || !Number.isInteger(id) || !action) {
    return NextResponse.json({ error: "审核参数无效" }, { status: 400 });
  }

  moderateImage(target, id, action, adminUser.id);
  return NextResponse.json({ ok: true });
}
