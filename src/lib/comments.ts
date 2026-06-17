import { getDb } from "./db";
import { Comment, RatingSummary } from "./types";
import { createPendingCommentImages, listApprovedCommentImagesByCommentIds } from "./images";

export function listComments(companyId: string): Comment[] {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT id, company_id as companyId, author, rating, content, created_at as createdAt FROM comments WHERE company_id = ? ORDER BY id DESC"
    )
    .all(companyId) as Comment[];
  const imageMap = listApprovedCommentImagesByCommentIds(rows.map((row) => row.id));
  return rows.map((row) => ({ ...row, images: imageMap[row.id] || [] }));
}

export function getRatingSummary(companyId: string): RatingSummary {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT AVG(rating) as average, COUNT(*) as count FROM comments WHERE company_id = ?"
    )
    .get(companyId) as { average: number | null; count: number };
  return {
    average: row.average ? Math.round(row.average * 10) / 10 : 0,
    count: row.count,
  };
}

export function addComment(
  companyId: string,
  author: string,
  rating: number,
  content: string
): Comment {
  const db = getDb();
  const info = db
    .prepare(
      "INSERT INTO comments (company_id, author, rating, content) VALUES (?, ?, ?, ?)"
    )
    .run(companyId, author || "匿名用户", rating, content);
  return db
    .prepare(
      "SELECT id, company_id as companyId, author, rating, content, created_at as createdAt FROM comments WHERE id = ?"
    )
    .get(info.lastInsertRowid) as Comment;
}

export function addCommentWithImages(
  companyId: string,
  author: string,
  rating: number,
  content: string,
  uploaderUserId: string,
  files: Array<{ fileUrl: string; mimeType: string; fileSize: number }>
): Comment {
  const comment = addComment(companyId, author, rating, content);
  if (files.length > 0) {
    createPendingCommentImages(comment.id, companyId, uploaderUserId, files);
  }
  return { ...comment, images: [] };
}
