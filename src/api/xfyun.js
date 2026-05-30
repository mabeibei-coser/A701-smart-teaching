/**
 * 课堂互动方案生成 —— 调用后端 /api/generate-interaction。
 * AI 密钥与 prompt 构造已移至后端（server.js + lib/interaction-prompt.js），
 * 浏览器不再直接持有讯飞 key；每次生成会在后端同时落库到 reports 表。
 */

export async function generateInteraction(params) {
  const res = await fetch('/api/generate-interaction', {
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
  return data.report;
}
