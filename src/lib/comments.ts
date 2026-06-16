import { getDb } from "./db";
import { Comment, RatingSummary } from "./types";

export function listComments(companyId: string): Comment[] {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT id, company_id as companyId, author, rating, content, created_at as createdAt FROM comments WHERE company_id = ? ORDER BY id DESC"
    )
    .all(companyId) as Comment[];
  return rows;
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
