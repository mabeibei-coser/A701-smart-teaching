import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(PROJECT_ROOT, "data");
const DB_PATH =
  process.env.SMART_TEACHING_DB_PATH || path.join(DATA_DIR, "smart-teaching.db");

let _db = null;

export function getDb() {
  if (_db) return _db;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("busy_timeout = 5000");

  _db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      phone         TEXT NOT NULL UNIQUE,
      created_at    INTEGER NOT NULL,
      last_login_at INTEGER
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
  `);

  _db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL,
      user_phone   TEXT    NOT NULL,
      created_at   INTEGER NOT NULL,
      type         TEXT    NOT NULL,   -- 生成类型：interaction（课堂互动方案）等
      topic        TEXT    NOT NULL,   -- 教学主题
      case_type    TEXT,               -- 互动类型（案例分析/正反辩论/角色扮演...）
      difficulty   TEXT,               -- 难易程度（基础/进阶/挑战）
      params_json  TEXT,               -- 完整输入参数（含补充要求、教材上下文等）
      report_json  TEXT    NOT NULL,   -- AI 返回的完整 JSON
      duration_ms  INTEGER,
      ip           TEXT,
      user_agent   TEXT,
      attachment_size INTEGER          -- 课件图片字节大小；互动类报告为 NULL
    );
    CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_reports_user      ON reports(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_reports_phone     ON reports(user_phone, created_at DESC);
  `);

  // 增量迁移：老库补 attachment_size 列（幂等，先查后加）
  const reportCols = _db.prepare("PRAGMA table_info(reports)").all();
  if (!reportCols.some((c) => c.name === "attachment_size")) {
    _db.exec("ALTER TABLE reports ADD COLUMN attachment_size INTEGER");
  }

  return _db;
}

export function upsertUserByPhone(phone) {
  const db = getDb();
  const now = Date.now();
  const existing = db.prepare("SELECT id FROM users WHERE phone = ?").get(phone);
  if (existing) {
    db.prepare("UPDATE users SET last_login_at = ? WHERE id = ?").run(now, existing.id);
    return existing.id;
  }
  const info = db
    .prepare("INSERT INTO users(phone, created_at, last_login_at) VALUES (?, ?, ?)")
    .run(phone, now, now);
  return Number(info.lastInsertRowid);
}

export function insertReport(payload) {
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO reports(
        user_id, user_phone, created_at,
        type, topic, case_type, difficulty,
        params_json, report_json, duration_ms, ip, user_agent, attachment_size
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      payload.userId,
      payload.userPhone,
      payload.createdAt,
      payload.type,
      payload.topic,
      payload.caseType ?? null,
      payload.difficulty ?? null,
      payload.paramsJson ?? null,
      JSON.stringify(payload.report),
      payload.durationMs ?? null,
      payload.ip ?? null,
      payload.userAgent ?? null,
      payload.attachmentSize ?? null
    );
  return Number(info.lastInsertRowid);
}

/**
 * 给课堂互动报告补挂截图：客户端 html2canvas 截图存进 report_json.screenshotImage，
 * 并写入 attachment_size，使后台列表"附件大小"有值、详情页能预览。
 * 限定 owner + type='interaction'，防越权 / 防误挂到课件。
 * 返回 true=更新成功；报告不存在或不属于该用户返回 false。
 */
export function attachInteractionImage({ reportId, userId, imageDataUrl, attachmentSize }) {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT report_json FROM reports WHERE id = ? AND user_id = ? AND type = 'interaction'"
    )
    .get(reportId, userId);
  if (!row) return false;
  let report;
  try {
    report = JSON.parse(row.report_json);
  } catch {
    report = {};
  }
  report.screenshotImage = imageDataUrl;
  db.prepare("UPDATE reports SET report_json = ?, attachment_size = ? WHERE id = ?").run(
    JSON.stringify(report),
    attachmentSize,
    reportId
  );
  return true;
}
