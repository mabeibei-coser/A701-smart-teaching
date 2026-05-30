/**
 * 拼接带部署前缀的 URL。
 *
 * 子路径部署（如 nginx 反代到 /a701/）时，Vite 的 import.meta.env.BASE_URL
 * 会是 "/a701/"；根部署时是 "/"。裸 fetch('/api/..') 在子路径下会丢前缀、线上 404，
 * 所以所有客户端请求与分享链接都要经这里拼。
 */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, ""); // "" 或 "/a701"

/** 后端 API 地址：apiUrl('/api/me') → "/api/me"（根）或 "/a701/api/me"（子路径） */
export function apiUrl(path) {
  return `${BASE}${path}`;
}
