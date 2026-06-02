import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// 优先加载 .env.local，否则回退 .env
dotenv.config({ path: path.join(__dirname, ".env.local") });
dotenv.config({ path: path.join(__dirname, ".env") });

const { default: express } = await import("express");
const { getSession } = await import("./lib/session.js");
const {
  getDb,
  upsertUserByPhone,
  insertReport,
  attachInteractionImage,
  getReportsByUserId,
  getReportImage,
} = await import("./lib/db.js");
const { buildInteractionMessages, parseAIJsonResponse } = await import(
  "./lib/interaction-prompt.js"
);
const { generateCoursewareImage, dataUrlByteSize } = await import(
  "./lib/courseware.js"
);

const { checkPhoneAllowed } = await import("./lib/gate.js");

const PORT = Number(process.env.PORT) || 4701;
const IFLYTEK_URL =
  process.env.IFLYTEK_API_URL ||
  "https://maas-coding-api.cn-huabei-1.xf-yun.com/v2/chat/completions";
const IFLYTEK_API_KEY = process.env.IFLYTEK_API_KEY || process.env.VITE_XFYUN_API_KEY;
const IFLYTEK_MODEL =
  process.env.IFLYTEK_MODEL || process.env.VITE_XFYUN_MODEL || "astron-code-latest";

const app = express();
app.set("trust proxy", true);
// 默认 1mb；互动截图补传接口需更大体积（base64 JPEG 可达数 MB），单独放宽到 8mb
app.use((req, res, next) => {
  const limit = req.path === "/api/attach-interaction-image" ? "8mb" : "1mb";
  express.json({ limit })(req, res, next);
});

const PHONE_RE = /^1[3-9]\d{9}$/;

function requireSession(handler) {
  return async (req, res) => {
    const session = await getSession(req, res);
    if (!session.userId) {
      return res.status(401).json({ error: "请先登录" });
    }
    req.session = session;
    return handler(req, res);
  };
}

// ── 登录 / 登出 / 当前用户 ──

app.post("/api/login", async (req, res) => {
  const phone = String(req.body?.phone || "").trim();
  if (!PHONE_RE.test(phone)) {
    return res.status(400).json({ error: "请输入有效的 11 位手机号" });
  }
  // 白名单校验：仅后台「课件用户」名单中且启用的手机号可登录（fail-closed）
  let allowed;
  try {
    allowed = await checkPhoneAllowed(phone);
  } catch (err) {
    console.error("[login] 白名单校验失败:", err.message);
    return res.status(503).json({ error: "登录服务暂时不可用，请稍后重试" });
  }
  if (!allowed) {
    return res
      .status(403)
      .json({ error: "您的手机号未授权使用本平台，请联系管理员开通" });
  }
  try {
    const userId = upsertUserByPhone(phone);
    const session = await getSession(req, res);
    session.userId = userId;
    session.phone = phone;
    session.loggedInAt = Date.now();
    await session.save();
    res.json({ ok: true, userId, phone });
  } catch (err) {
    console.error("[login] failed:", err);
    res.status(500).json({ error: "登录失败，请稍后重试" });
  }
});

app.post("/api/logout", async (req, res) => {
  const session = await getSession(req, res);
  await session.destroy();
  res.json({ ok: true });
});

app.get("/api/me", async (req, res) => {
  const session = await getSession(req, res);
  if (!session.userId) return res.status(401).json({ error: "未登录" });
  res.json({ userId: session.userId, phone: session.phone });
});

// ── 我的资料：从服务器加载历史（前端历史以服务端为准，跨浏览器/设备同步）──

app.get(
  "/api/my-reports",
  requireSession(async (req, res) => {
    try {
      const rows = getReportsByUserId(req.session.userId);
      const reports = rows.map((row) => {
        let report = {};
        try {
          report = JSON.parse(row.report_json);
        } catch {
          report = {};
        }
        const base = {
          id: String(row.id),
          fromServer: true,
          topic: row.topic,
          label: row.topic,
          duration: row.duration_ms != null ? Math.round(row.duration_ms / 1000) : null,
          createdAt: row.created_at,
        };
        if (row.type === "courseware") {
          return {
            ...base,
            type: "card",
            cardType: report.cardType ?? null,
            cardStyle: report.cardStyle ?? null,
            cardSize: report.cardSize ?? null,
            prompt: report.revisedPrompt ?? null,
            hasImage: !!report.imageDataUrl,
          };
        }
        // 互动：data 去掉大字段 screenshotImage，缩略图走懒加载接口
        const { screenshotImage, ...data } = report;
        return {
          ...base,
          type: "discussion",
          caseType: row.case_type ?? null,
          difficulty: row.difficulty ?? null,
          data,
          hasImage: !!screenshotImage,
        };
      });
      res.json({ reports });
    } catch (err) {
      console.error("[my-reports] failed:", err);
      res.status(500).json({ error: "加载历史失败" });
    }
  })
);

app.get(
  "/api/my-reports/:id/image",
  requireSession(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "参数无效" });
    }
    const imageDataUrl = getReportImage(id, req.session.userId);
    if (!imageDataUrl) return res.status(404).json({ error: "无图片" });
    res.json({ imageDataUrl });
  })
);

// ── 课堂互动方案：调讯飞 + 入库（一次性原子）──

app.post(
  "/api/generate-interaction",
  requireSession(async (req, res) => {
    const { topic, supplement, caseType, difficulty, bookContext } = req.body || {};
    if (typeof topic !== "string" || !topic.trim()) {
      return res.status(400).json({ error: "请输入互动主题" });
    }
    if (!IFLYTEK_API_KEY) {
      return res.status(500).json({ error: "服务器未配置 AI API key" });
    }

    const startedAt = Date.now();
    try {
      const upstream = await fetch(IFLYTEK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${IFLYTEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: IFLYTEK_MODEL,
          messages: buildInteractionMessages({
            topic: topic.trim(),
            supplement,
            caseType,
            difficulty,
            bookContext,
          }),
          temperature: 0.5,
          max_tokens: 4096,
        }),
        signal: AbortSignal.timeout(60_000),
      });

      if (!upstream.ok) {
        const text = await upstream.text().catch(() => "");
        console.error("[generate-interaction] iFlytek HTTP", upstream.status, text.slice(0, 300));
        return res.status(502).json({ error: `AI 请求失败 (${upstream.status})` });
      }

      const result = await upstream.json();
      const content = result?.choices?.[0]?.message?.content;
      if (!content) {
        return res.status(502).json({ error: "AI 返回内容为空" });
      }

      let report;
      try {
        report = parseAIJsonResponse(content);
      } catch {
        return res.status(502).json({ error: "AI 返回内容不是有效 JSON" });
      }

      const durationMs = Date.now() - startedAt;
      const reportId = insertReport({
        userId: req.session.userId,
        userPhone: req.session.phone,
        createdAt: Date.now(),
        type: "interaction",
        topic: topic.trim(),
        caseType: caseType || null,
        difficulty: difficulty || null,
        paramsJson: JSON.stringify({
          topic: topic.trim(),
          supplement: supplement || "",
          caseType: caseType || "",
          difficulty: difficulty || "",
          bookContext: bookContext || "",
        }),
        report,
        durationMs,
        ip: req.ip,
        userAgent: req.headers["user-agent"] || null,
      });

      res.json({ ok: true, reportId, report, durationMs });
    } catch (err) {
      if (err?.name === "TimeoutError" || err?.name === "AbortError") {
        return res.status(504).json({ error: "请求超时（60秒），请稍后重试" });
      }
      console.error("[generate-interaction] failed:", err);
      res.status(500).json({ error: "生成失败，请稍后重试" });
    }
  })
);

// ── 课堂互动：补传页面截图（生成后客户端 html2canvas → 这里入库）──

app.post(
  "/api/attach-interaction-image",
  requireSession(async (req, res) => {
    const { reportId, imageDataUrl } = req.body || {};
    const id = Number(reportId);
    if (
      !Number.isInteger(id) ||
      typeof imageDataUrl !== "string" ||
      !imageDataUrl.startsWith("data:image/")
    ) {
      return res.status(400).json({ error: "参数无效" });
    }
    const attachmentSize = dataUrlByteSize(imageDataUrl);
    if (attachmentSize > 6 * 1024 * 1024) {
      return res.status(413).json({ error: "截图过大（>6MB）" });
    }
    try {
      const ok = attachInteractionImage({
        reportId: id,
        userId: req.session.userId,
        imageDataUrl,
        attachmentSize,
      });
      if (!ok) return res.status(404).json({ error: "报告不存在或无权限" });
      res.json({ ok: true, attachmentSize });
    } catch (err) {
      console.error("[attach-interaction-image] failed:", err);
      res.status(500).json({ error: "截图保存失败" });
    }
  })
);

// ── 智能课件：服务端调图片 API + 入库（一次性原子）──

app.post(
  "/api/generate-courseware",
  requireSession(async (req, res) => {
    const { topic, cardType, cardStyle, cardSize, line, bookName, notes } =
      req.body || {};
    if (typeof topic !== "string" || !topic.trim()) {
      return res.status(400).json({ error: "请输入主题内容" });
    }

    const startedAt = Date.now();
    try {
      const { imageDataUrl, revisedPrompt } = await generateCoursewareImage({
        topic: topic.trim(),
        cardType,
        cardStyle,
        cardSize,
        line,
        bookName,
        notes,
      });

      const durationMs = Date.now() - startedAt;
      const attachmentSize = dataUrlByteSize(imageDataUrl);
      const reportId = insertReport({
        userId: req.session.userId,
        userPhone: req.session.phone,
        createdAt: Date.now(),
        type: "courseware",
        topic: topic.trim(),
        caseType: null,
        difficulty: null,
        paramsJson: JSON.stringify({
          topic: topic.trim(),
          cardType: cardType || "",
          cardStyle: cardStyle || "",
          cardSize: cardSize || "",
          line: line || "line1",
          bookName: bookName || "",
          notes: notes || "",
        }),
        report: { imageDataUrl, revisedPrompt, cardType, cardStyle, cardSize, line },
        durationMs,
        attachmentSize,
        ip: req.ip,
        userAgent: req.headers["user-agent"] || null,
      });

      res.json({ ok: true, reportId, imageDataUrl, revisedPrompt, durationMs });
    } catch (err) {
      console.error("[generate-courseware] failed:", err);
      res.status(502).json({ error: err.message || "课件生成失败，请稍后重试" });
    }
  })
);

// ── 生产模式：托管 dist/ 静态资源 ──
if (process.env.NODE_ENV === "production") {
  const distDir = path.join(__dirname, "dist");
  app.use(express.static(distDir));
  app.get("*", (req, res) => res.sendFile(path.join(distDir, "index.html")));
}

app.listen(PORT, () => {
  try {
    getDb(); // 触发建表
    console.log(`[smart-teaching] api server on http://localhost:${PORT}`);
  } catch (err) {
    console.error("[smart-teaching] DB 初始化失败:", err);
  }
});
