/**
 * 课件图片生成 —— line3（豆包 Seedream）。
 * 实际调用 + 密钥均在服务端 /api/generate-courseware，前端只传参。
 */
import { postCourseware } from './imageGen';

export async function generateCardImageDoubao(params) {
  return postCourseware({ ...params, line: 'line3' });
}
