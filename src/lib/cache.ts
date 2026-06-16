import { getDb } from "./db";

// 基于 SQLite 的查询缓存。key 由查询参数派生,payload 为序列化的 JSON。
export function cacheGet<T>(key: string): T | null {
  const db = getDb();
  const row = db
    .prepare("SELECT payload, expires_at FROM query_cache WHERE cache_key = ?")
    .get(key) as { payload: string; expires_at: number } | undefined;

  if (!row) return null;
  if (row.expires_at < Date.now()) {
    db.prepare("DELETE FROM query_cache WHERE cache_key = ?").run(key);
    return null;
  }
  try {
    return JSON.parse(row.payload) as T;
  } catch {
    return null;
  }
}

export function cacheSet<T>(key: string, value: T, ttlSeconds: number): void {
  const db = getDb();
  const expiresAt = Date.now() + ttlSeconds * 1000;
  db.prepare(
    "INSERT OR REPLACE INTO query_cache (cache_key, payload, expires_at) VALUES (?, ?, ?)"
  ).run(key, JSON.stringify(value), expiresAt);
}
