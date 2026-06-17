import crypto from "crypto";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/authSession";
import { getUserById, updateUserProfile } from "@/lib/authRepo";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const AVATAR_DIR = path.join(process.cwd(), "public", "uploads", "avatars");

function extensionFor(mimeType: string): string {
  switch (mimeType) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    default:
      return "";
  }
}

export async function POST(req: Request) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "请选择头像图片" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "仅支持 JPG、PNG、WEBP、GIF 图片" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "头像大小不能超过 2MB" }, { status: 400 });
  }

  fs.mkdirSync(AVATAR_DIR, { recursive: true });
  const ext = extensionFor(file.type);
  const filename = `${currentUser.id}-${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
  const relativePath = `/uploads/avatars/${filename}`;
  const filePath = path.join(AVATAR_DIR, filename);
  const bytes = await file.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(bytes));

  updateUserProfile(currentUser.id, currentUser.nickname, relativePath);
  const user = getUserById(currentUser.id);
  return NextResponse.json({ ok: true, user, avatarUrl: relativePath });
}
