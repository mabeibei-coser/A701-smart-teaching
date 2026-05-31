/**
 * 课堂互动方案生成 —— 调用后端 /api/generate-interaction。
 * AI 密钥与 prompt 构造已移至后端（server.js + lib/interaction-prompt.js），
 * 浏览器不再直接持有讯飞 key；每次生成会在后端同时落库到 reports 表。
 */
import { apiUrl } from './base';

export async function generateInteraction(params) {
  const res = await fetch(apiUrl('/api/generate-interaction'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    let message = `生成失败 (${res.status})`;
    try {
      const err = await res.json();
      if (err?.error) message = err.error;
    } catch {}
    if (res.status === 401) message = '登录已过期，请重新登录';
    throw new Error(message);
  }

  const data = await res.json();
  return { report: data.report, reportId: data.reportId };
}

/**
 * 把课堂互动方案的页面截图补传到服务端入库（best-effort：失败不打断用户）。
 * 生成接口入库时还没有截图，截图在前端渲染后才由 html2canvas 产出，故分两步。
 */
export async function attachInteractionImage(reportId, imageDataUrl) {
  if (!reportId || !imageDataUrl) return;
  try {
    await fetch(apiUrl('/api/attach-interaction-image'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, imageDataUrl }),
    });
  } catch {
    /* 截图补传失败不影响主流程 */
  }
}
