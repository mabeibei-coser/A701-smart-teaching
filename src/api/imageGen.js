/**
 * 课件图片生成 —— line1（GPT Image-2）。
 *
 * 实际的图片 API 调用与密钥都在服务端 /api/generate-courseware，
 * 前端只负责传参 + 拿回图片，浏览器里看不到任何 key。
 */

/** 调服务端统一课件生成接口（被三条线路共用） */
export async function postCourseware(params) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 250000);
  try {
    const response = await fetch('/api/generate-courseware', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `课件生成失败 (${response.status})`);
    }
    return {
      imageDataUrl: data.imageDataUrl,
      revisedPrompt: data.revisedPrompt || '',
      reportId: data.reportId,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('图片生成超时（250秒），请重试');
    }
    throw error;
  }
}

/** line1：GPT Image-2 */
export async function generateCardImage(params) {
  return postCourseware({ ...params, line: 'line1' });
}

/** 获取尺寸对应的宽高（用于 UI 显示） */
export function getCardDimensions(cardSize) {
  const map = {
    '3:2': { width: 1536, height: 1024, label: '3:2 (1536×1024)' },
    '9:16': { width: 720, height: 1280, label: '9:16 (720×1280)' },
  };
  return map[cardSize] || map['3:2'];
}
