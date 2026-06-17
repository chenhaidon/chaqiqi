import crypto from "crypto";
import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/authSession";
import { createPendingCompanyImages, listApprovedCompanyImages } from "@/lib/images";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const COMPANY_IMAGE_DIR = path.join(process.cwd(), "public", "uploads", "company-images");

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

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  return NextResponse.json({ images: listApprovedCompanyImages(id) });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录后再上传企业图片" }, { status: 401 });
  }

  const id = decodeURIComponent(params.id);
  const formData = await req.formData();
  const files = formData.getAll("files");
  if (files.length === 0) {
    return NextResponse.json({ error: "请选择至少一张企业图片" }, { status: 400 });
  }

  fs.mkdirSync(COMPANY_IMAGE_DIR, { recursive: true });
  const savedFiles: Array<{ fileUrl: string; mimeType: string; fileSize: number }> = [];

  for (const entry of files) {
    if (!(entry instanceof File)) {
      return NextResponse.json({ error: "上传文件无效" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(entry.type)) {
      return NextResponse.json({ error: "仅支持 JPG、PNG、WEBP、GIF 图片" }, { status: 400 });
    }
    if (entry.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "单张企业图片不能超过 5MB" }, { status: 400 });
    }

    const ext = extensionFor(entry.type);
    const filename = `${user.id}-${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
    const relativePath = `/uploads/company-images/${filename}`;
    const filePath = path.join(COMPANY_IMAGE_DIR, filename);
    const bytes = await entry.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(bytes));
    savedFiles.push({ fileUrl: relativePath, mimeType: entry.type, fileSize: entry.size });
  }

  createPendingCompanyImages(id, user.id, savedFiles);
  return NextResponse.json({ ok: true, message: "企业图片已提交，审核通过后展示" }, { status: 201 });
}
