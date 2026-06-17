import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

// 单例数据库连接。Next.js 开发模式下模块会热重载,
// 用 globalThis 缓存避免重复打开连接。
const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "app.db");

declare global {
  // eslint-disable-next-line no-var
  var __chaqiqi_db: Database.Database | undefined;
}

function ensureUserColumn(db: Database.Database, columnName: string, definition: string) {
  const columns = db.prepare(`PRAGMA table_info(users)`).all() as Array<{ name: string }>;
  if (!columns.some((column) => column.name === columnName)) {
    db.exec(`ALTER TABLE users ADD COLUMN ${columnName} ${definition}`);
  }
}

function init(): Database.Database {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  // 评论打分表
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id  TEXT    NOT NULL,
      author      TEXT    NOT NULL DEFAULT '匿名用户',
      rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      content     TEXT    NOT NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_comments_company ON comments(company_id);
  `);

  // 查询结果缓存表(降低对付费接口的重复调用)
  db.exec(`
    CREATE TABLE IF NOT EXISTS query_cache (
      cache_key  TEXT PRIMARY KEY,
      payload    TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
  `);

  // 企业主数据表(数据库优先查询,API 回源后入库)
  db.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id                 TEXT PRIMARY KEY,
      name               TEXT NOT NULL,
      status             TEXT NOT NULL DEFAULT '',
      credit_code        TEXT NOT NULL DEFAULT '',
      legal_person       TEXT NOT NULL DEFAULT '',
      registered_capital TEXT NOT NULL DEFAULT '',
      establish_date     TEXT NOT NULL DEFAULT '',
      address            TEXT NOT NULL DEFAULT '',
      business_scope     TEXT NOT NULL DEFAULT '',
      province           TEXT NOT NULL DEFAULT '',
      source             TEXT NOT NULL DEFAULT 'qcc',
      created_at         TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at         TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
    CREATE INDEX IF NOT EXISTS idx_companies_credit_code ON companies(credit_code);
    CREATE INDEX IF NOT EXISTS idx_companies_legal_person ON companies(legal_person);
    CREATE INDEX IF NOT EXISTS idx_companies_province ON companies(province);
  `);

  // 用户与认证表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      nickname TEXT NOT NULL DEFAULT '',
      avatar_url TEXT NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL,
      email_verified INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_email_verification_user ON email_verification_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_email_verification_expires ON email_verification_tokens(expires_at);

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_tokens(expires_at);

    CREATE TABLE IF NOT EXISTS company_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id TEXT NOT NULL,
      uploader_user_id TEXT NOT NULL,
      file_url TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      review_reason TEXT NOT NULL DEFAULT '',
      reviewed_by_user_id TEXT NOT NULL DEFAULT '',
      reviewed_at TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_company_images_company_status ON company_images(company_id, status);
    CREATE INDEX IF NOT EXISTS idx_company_images_status_created ON company_images(status, created_at);

    CREATE TABLE IF NOT EXISTS comment_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      comment_id INTEGER NOT NULL,
      company_id TEXT NOT NULL,
      uploader_user_id TEXT NOT NULL,
      file_url TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      review_reason TEXT NOT NULL DEFAULT '',
      reviewed_by_user_id TEXT NOT NULL DEFAULT '',
      reviewed_at TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_comment_images_comment_status ON comment_images(comment_id, status);
    CREATE INDEX IF NOT EXISTS idx_comment_images_company_status ON comment_images(company_id, status);
    CREATE INDEX IF NOT EXISTS idx_comment_images_status_created ON comment_images(status, created_at);
  `);

  ensureUserColumn(db, "nickname", "TEXT NOT NULL DEFAULT ''");
  ensureUserColumn(db, "avatar_url", "TEXT NOT NULL DEFAULT ''");

  return db;
}

export function getDb(): Database.Database {
  if (!global.__chaqiqi_db) {
    global.__chaqiqi_db = init();
  }
  return global.__chaqiqi_db;
}
