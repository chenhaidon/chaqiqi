import crypto from "crypto";
import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { addCommentWithImages, listComments } from "@/lib/comments";
import { getCurrentUser } from "@/lib/authSession";

export const dynamic = "force-dynamic";

const MAX_COMMENT_IMAGE_SIZE = 3 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const COMMENT_IMAGE_DIR = path.join(process.cwd(), "public", "uploads", "comment-images");

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

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = decodeURIComponent(params.id);
  return NextResponse.json({ comments: listComments(id) });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录后再发表评论" }, { status: 401 });
  }

  const id = decodeURIComponent(params.id);
  const formData = await req.formData();
  const content = typeof formData.get("content") === "string" ? String(formData.get("content")).trim() : "";
  const rating = Number(formData.get("rating"));
  const imageFiles = formData.getAll("images");

  if (!content) {
    return NextResponse.json({ error: "评论内容不能为空" }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "评分需为 1-5 的整数" }, { status: 400 });
  }
  if (content.length > 500) {
    return NextResponse.json({ error: "评论内容不超过 500 字" }, { status: 400 });
  }
  if (imageFiles.length > 3) {
    return NextResponse.json({ error: "评论图片最多上传 3 张" }, { status: 400 });
  }

  fs.mkdirSync(COMMENT_IMAGE_DIR, { recursive: true });
  const savedFiles: Array<{ fileUrl: string; mimeType: string; fileSize: number }> = [];

  for (const entry of imageFiles) {
    if (!(entry instanceof File)) {
      return NextResponse.json({ error: "评论图片无效" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(entry.type)) {
      return NextResponse.json({ error: "评论图片仅支持 JPG、PNG、WEBP、GIF" }, { status: 400 });
    }
    if (entry.size > MAX_COMMENT_IMAGE_SIZE) {
      return NextResponse.json({ error: "单张评论图片不能超过 3MB" }, { status: 400 });
    }

    const ext = extensionFor(entry.type);
    const filename = `${user.id}-${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
    const relativePath = `/uploads/comment-images/${filename}`;
    const filePath = path.join(COMMENT_IMAGE_DIR, filename);
    const bytes = await entry.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(bytes));
    savedFiles.push({ fileUrl: relativePath, mimeType: entry.type, fileSize: entry.size });
  }

  const comment = addCommentWithImages(id, user.email, rating, content, user.id, savedFiles);
  return NextResponse.json(
    { comment, message: savedFiles.length > 0 ? "评论已发表，图片审核通过后展示" : "评论已发表" },
    { status: 201 }
  );
}
