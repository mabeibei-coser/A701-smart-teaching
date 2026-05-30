/**
 * 课件图片生成 —— line2（讯飞星火 TTI）。
 * 实际调用 + HMAC 签名 + 密钥均在服务端 /api/generate-courseware，前端只传参。
 */
import { postCourseware } from './imageGen';

export async function generateCardImageXF(params) {
  return postCourseware({ ...params, line: 'line2' });
}
