import { getDb } from "./db";
import type { CommentImage, ImageAsset } from "./types";

export type ModerationTarget = "company_image" | "comment_image";

type CompanyImageRow = {
  id: number;
  company_id: string;
  file_url: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

type CommentImageRow = {
  id: number;
  comment_id: number;
  company_id: string;
  file_url: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

function mapCompanyImage(row: CompanyImageRow): ImageAsset {
  return {
    id: row.id,
    companyId: row.company_id,
    fileUrl: row.file_url,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapCommentImage(row: CommentImageRow): CommentImage {
  return {
    id: row.id,
    commentId: row.comment_id,
    companyId: row.company_id,
    fileUrl: row.file_url,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function listApprovedCompanyImages(companyId: string): ImageAsset[] {
  const rows = getDb()
    .prepare(
      `SELECT id, company_id, file_url, status, created_at FROM company_images WHERE company_id = ? AND status = 'approved' ORDER BY id DESC`
    )
    .all(companyId) as CompanyImageRow[];
  return rows.map(mapCompanyImage);
}

export function createPendingCompanyImages(
  companyId: string,
  uploaderUserId: string,
  files: Array<{ fileUrl: string; mimeType: string; fileSize: number }>
): void {
  const db = getDb();
  const insert = db.prepare(
    `INSERT INTO company_images (company_id, uploader_user_id, file_url, mime_type, file_size) VALUES (?, ?, ?, ?, ?)`
  );
  const transaction = db.transaction(() => {
    for (const file of files) {
      insert.run(companyId, uploaderUserId, file.fileUrl, file.mimeType, file.fileSize);
    }
  });
  transaction();
}

export function createPendingCommentImages(
  commentId: number,
  companyId: string,
  uploaderUserId: string,
  files: Array<{ fileUrl: string; mimeType: string; fileSize: number }>
): void {
  const db = getDb();
  const insert = db.prepare(
    `INSERT INTO comment_images (comment_id, company_id, uploader_user_id, file_url, mime_type, file_size) VALUES (?, ?, ?, ?, ?, ?)`
  );
  const transaction = db.transaction(() => {
    for (const file of files) {
      insert.run(commentId, companyId, uploaderUserId, file.fileUrl, file.mimeType, file.fileSize);
    }
  });
  transaction();
}

export function listApprovedCommentImagesByCommentIds(commentIds: number[]): Record<number, CommentImage[]> {
  if (commentIds.length === 0) return {};
  const placeholders = commentIds.map(() => "?").join(",");
  const rows = getDb()
    .prepare(
      `SELECT id, comment_id, company_id, file_url, status, created_at FROM comment_images WHERE status = 'approved' AND comment_id IN (${placeholders}) ORDER BY id ASC`
    )
    .all(...commentIds) as CommentImageRow[];

  const grouped: Record<number, CommentImage[]> = {};
  for (const row of rows) {
    const image = mapCommentImage(row);
    if (!grouped[image.commentId]) grouped[image.commentId] = [];
    grouped[image.commentId].push(image);
  }
  return grouped;
}

export function listPendingModerationItems(): Array<{
  id: number;
  target: ModerationTarget;
  companyId: string;
  fileUrl: string;
  createdAt: string;
}> {
  const db = getDb();
  const companyRows = db
    .prepare(
      `SELECT id, company_id, file_url, created_at FROM company_images WHERE status = 'pending' ORDER BY id DESC`
    )
    .all() as Array<{ id: number; company_id: string; file_url: string; created_at: string }>;
  const commentRows = db
    .prepare(
      `SELECT id, company_id, file_url, created_at FROM comment_images WHERE status = 'pending' ORDER BY id DESC`
    )
    .all() as Array<{ id: number; company_id: string; file_url: string; created_at: string }>;

  return [
    ...companyRows.map((row) => ({ id: row.id, target: "company_image" as const, companyId: row.company_id, fileUrl: row.file_url, createdAt: row.created_at })),
    ...commentRows.map((row) => ({ id: row.id, target: "comment_image" as const, companyId: row.company_id, fileUrl: row.file_url, createdAt: row.created_at })),
  ].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function moderateImage(target: ModerationTarget, id: number, status: "approved" | "rejected", reviewerUserId: string): void {
  const table = target === "company_image" ? "company_images" : "comment_images";
  getDb()
    .prepare(
      `UPDATE ${table} SET status = ?, reviewed_by_user_id = ?, reviewed_at = datetime('now','localtime') WHERE id = ?`
    )
    .run(status, reviewerUserId, id);
}
