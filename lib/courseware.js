// 课件图片生成 —— 服务端实现。
//
// 原先前端 src/api/{imageGen,xfyunTti,doubaoImage}.js 直接带密钥调外部图片 API，
// 密钥暴露在浏览器 / vite.config.js（推 GitHub 会泄露）。现统一搬到服务端：
//   - 密钥只从 .env.local 读取，绝不硬编码（不进 git）
//   - 前端只调 /api/generate-courseware，看不到任何 key
//   - 生产环境（server.js 托管 dist）也能出图，不再依赖 vite dev 代理
//
// 三条线路：line1 = GPT Image-2(BananaRouter) / line2 = 讯飞星火 TTI / line3 = 豆包 Seedream。

import crypto from "node:crypto";

const TIMEOUT_MS = 240_000;

// ── 各线路密钥（仅环境变量；缺失则该线路不可用）──
const IMAGE_API_KEY = process.env.IMAGE_API_KEY || ""; // BananaRouter (GPT Image-2)
const XF_TTI_APP_ID = process.env.XF_TTI_APP_ID || "";
const XF_TTI_API_KEY = process.env.XF_TTI_API_KEY || "";
const XF_TTI_API_SECRET = process.env.XF_TTI_API_SECRET || "";
const DOUBAO_API_KEY = process.env.DOUBAO_API_KEY || "";

// ── 端点 / 模型 ──
const GPT_IMAGE_URL = "https://api.bananarouter.com/v1/images/generations";
const GPT_IMAGE_MODEL = process.env.GPT_IMAGE_MODEL || "gpt-image-2";
const XF_TTI_HOST = "maas-api.cn-huabei-1.xf-yun.com";
const XF_TTI_PATH = "/v2.1/tti";
const XF_TTI_MODEL = process.env.XF_TTI_MODEL || "xopqwentti20b";
const DOUBAO_URL = "https://ark.cn-beijing.volces.com/api/v3/images/generations";
const DOUBAO_MODEL = process.env.DOUBAO_MODEL || "doubao-seedream-5-0-260128";

/** 构建文生图 prompt（与原前端 imageGen.js 保持一致，只给方向不给模板） */
export function buildImagePrompt({ topic, cardType, cardStyle, bookName, notes }) {
  const typeDirections = {
    概念全景: '围绕"{topic}"展示核心概念及其子概念、关联关系，形成完整的知识全景。中心突出，分支清晰，覆盖全面，便于建立整体认知。',
    公式口诀: '提炼"{topic}"涉及的关键公式、定理或记忆口诀，配合简明推导与助记方法。公式醒目，口诀朗朗上口，便于理解与记忆。',
    时间线卡: '按时间顺序呈现"{topic}"的发展脉络与关键节点。脉络清晰，节点突出，展现演进过程。',
    重点难点: '梳理"{topic}"的教学重点与难点，标注哪些是核心必掌握、哪些是易错难懂之处。重点醒目，难点突出，详略得当。',
    宣传推广: '以富有吸引力的海报形式呈现"{topic}"，适合展示与传播。视觉冲击力强，主题鲜明，亮点突出。',
    自定义卡: '围绕"{topic}"自由组织内容，不拘泥固定结构，重点参考下方补充说明中的具体要求来设计。',
  };
  const styleDirections = {
    高等教育: "高等教育风格，专业大气，适合高校教学与培训",
    基础教学: "基础教育风格，形象生动，适合中小学与幼儿启蒙",
    白板风格: "白板质感，清晰明亮",
    黑板风格: "黑板质感，粉笔手绘",
    商务报告: "商务报告风格，专业大气，适合商业职场",
    信息图表: "信息图表，数据可视化",
    创意海报: "创意海报，个性灵感，富有视觉冲击力",
    火柴人: "火柴人，极简人物",
    手绘稿: "手绘稿风格，轻松活泼，亲和力强",
    自定义: "风格不限，自由发挥，可参考补充说明中的具体风格要求",
  };

  const typeDesc = typeDirections[cardType] || typeDirections["概念全景"];
  const styleDesc = styleDirections[cardStyle] || styleDirections["白板风格"];

  let prompt = `请为教学主题"${topic}"生成一张课件图片。\n\n`;
  prompt += `【内容方向】${typeDesc.replace(/{topic}/g, topic)}\n\n`;
  prompt += `【视觉风格】${styleDesc}\n\n`;
  prompt += `【通用要求】\n`;
  prompt += `- 所有文字必须为中文（简体中文）\n`;
  prompt += `- 信息精炼，使用简短关键词和短语，避免冗长句子\n`;
  prompt += `- 文字大小适合课堂投影（标题：大，正文：中大）\n`;
  prompt += `- 层次清晰，便于教师逐步讲解\n`;
  prompt += `- 学术准确，专业美观\n`;
  prompt += `- 图片需填满整个画面，充分利用空间\n`;
  if (bookName && bookName.trim()) {
    prompt += `\n【教材参考】基于《${bookName.trim()}》的内容，确保与标准课程一致。`;
  }
  if (notes && notes.trim()) {
    prompt += `\n\n【补充说明】${notes.trim()}`;
  }
  return prompt;
}

function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

// ── line1：GPT Image-2（BananaRouter，OpenAI 兼容）──
async function genGPT(prompt, cardSize) {
  if (!IMAGE_API_KEY) throw new Error("GPT 线路未配置 IMAGE_API_KEY");
  const SIZE_MAP = {
    "1:1": "1024x1024",
    "3:2": "1536x1024",
    "2:3": "1024x1536",
    "16:9": "1280x720",
    "9:16": "720x1280",
  };
  const size = SIZE_MAP[cardSize] || "1536x1024";
  const resp = await fetchWithTimeout(GPT_IMAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${IMAGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: GPT_IMAGE_MODEL,
      prompt,
      n: 1,
      size,
      quality: "medium",
      output_format: "b64_json",
    }),
  });
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error(`图片生成失败 (${resp.status}) ${t.slice(0, 200)}`);
  }
  const data = await resp.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("GPT Image 未返回图片数据");
  return {
    imageDataUrl: `data:image/png;base64,${b64}`,
    revisedPrompt: data.data[0].revised_prompt || "",
  };
}

// ── line2：讯飞星火 TTI（HMAC-SHA256 query 签名鉴权）──
function buildXFAuthorization() {
  const date = new Date().toUTCString();
  const requestLine = `POST ${XF_TTI_PATH} HTTP/1.1`;
  const tmp = `host: ${XF_TTI_HOST}\ndate: ${date}\n${requestLine}`;
  const signature = crypto
    .createHmac("sha256", XF_TTI_API_SECRET)
    .update(tmp)
    .digest("base64");
  const origin = `api_key="${XF_TTI_API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
  const authorization = Buffer.from(origin).toString("base64");
  const params = new URLSearchParams({ authorization, date, host: XF_TTI_HOST });
  return params.toString();
}

async function genXF(prompt, cardSize) {
  if (!XF_TTI_API_KEY || !XF_TTI_API_SECRET || !XF_TTI_APP_ID) {
    throw new Error("讯飞星火线路未配置 XF_TTI_APP_ID/API_KEY/API_SECRET");
  }
  const SIZE_MAP = {
    "1:1": { width: 1024, height: 1024 },
    "3:2": { width: 1024, height: 768 },
    "2:3": { width: 768, height: 1024 },
    "16:9": { width: 1280, height: 720 },
    "9:16": { width: 576, height: 1024 },
  };
  const dims = SIZE_MAP[cardSize] || SIZE_MAP["3:2"];
  const seed = crypto.randomInt(0, 2147483647);
  const url = `https://${XF_TTI_HOST}${XF_TTI_PATH}?${buildXFAuthorization()}`;
  const resp = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      header: { app_id: XF_TTI_APP_ID, patch_id: [] },
      parameter: {
        chat: {
          domain: XF_TTI_MODEL,
          width: dims.width,
          height: dims.height,
          seed,
          num_inference_steps: 20,
          guidance_scale: 5.0,
          scheduler: "Euler",
        },
      },
      payload: { message: { text: [{ role: "user", content: prompt }] } },
    }),
  });
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error(`讯飞 TTI 请求失败 (${resp.status}) ${t.slice(0, 200)}`);
  }
  const data = await resp.json();
  if (data.header?.code !== 0) {
    throw new Error(`讯飞 TTI 返回错误 (${data.header?.code}): ${data.header?.message || "未知"}`);
  }
  const b64 = data.payload?.choices?.text?.[0]?.content;
  if (!b64) throw new Error("讯飞 TTI 未返回图片数据");
  return { imageDataUrl: `data:image/png;base64,${b64}`, revisedPrompt: "" };
}

// ── line3：豆包 Seedream（OpenAI 兼容）──
async function genDoubao(prompt, cardSize) {
  if (!DOUBAO_API_KEY) throw new Error("豆包线路未配置 DOUBAO_API_KEY");
  const SIZE_MAP = { "3:2": "2048x2048", "9:16": "2048x2048" };
  const size = SIZE_MAP[cardSize] || "2048x2048";
  const resp = await fetchWithTimeout(DOUBAO_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DOUBAO_API_KEY}`,
    },
    body: JSON.stringify({
      model: DOUBAO_MODEL,
      prompt,
      n: 1,
      size,
      response_format: "b64_json",
    }),
  });
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error(`豆包 Seedream 请求失败 (${resp.status}) ${t.slice(0, 200)}`);
  }
  const data = await resp.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error("豆包 Seedream 未返回图片数据");
  return { imageDataUrl: `data:image/png;base64,${b64}`, revisedPrompt: "" };
}

/**
 * 统一入口：根据 line 选线路生成课件图片。
 * @returns {Promise<{imageDataUrl: string, revisedPrompt: string}>}
 */
export async function generateCoursewareImage(params) {
  const { line = "line1", cardSize = "3:2" } = params;
  const prompt = buildImagePrompt(params);
  try {
    if (line === "line2") return await genXF(prompt, cardSize);
    if (line === "line3") return await genDoubao(prompt, cardSize);
    return await genGPT(prompt, cardSize);
  } catch (err) {
    if (err?.name === "AbortError" || err?.name === "TimeoutError") {
      throw new Error("图片生成超时（240秒），请重试");
    }
    throw err;
  }
}

/** 估算 base64 dataURL 的实际字节大小（用于 attachment_size） */
export function dataUrlByteSize(dataUrl) {
  if (!dataUrl) return 0;
  const b64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
  const padding = (b64.match(/=+$/) || [""])[0].length;
  return Math.max(0, Math.round(b64.length * 0.75) - padding);
}
