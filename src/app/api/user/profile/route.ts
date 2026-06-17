import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/authSession";
import { getUserById, updateUserProfile } from "@/lib/authRepo";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  const nickname = typeof body.nickname === "string" ? body.nickname.trim() : "";
  const avatarUrl = typeof body.avatarUrl === "string" ? body.avatarUrl.trim() : "";

  if (nickname.length > 20) {
    return NextResponse.json({ error: "昵称最多 20 个字符" }, { status: 400 });
  }
  if (avatarUrl && !avatarUrl.startsWith("/uploads/avatars/")) {
    return NextResponse.json({ error: "头像路径无效" }, { status: 400 });
  }

  updateUserProfile(currentUser.id, nickname, avatarUrl);
  const user = getUserById(currentUser.id);
  return NextResponse.json({ ok: true, user });
}
