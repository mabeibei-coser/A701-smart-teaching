// 课件用户白名单校验客户端。
// 登录时调 admin-hub 的 gate 接口，判断手机号是否在「课件用户」名单且为启用状态。
//
// 设计为 fail-closed：任何异常（env 未配置 / 网络错 / 超时 / admin-hub 不可达 / 非 2xx）
// 都向上抛错，由调用方拒绝登录——绝不在异常时放行，否则等于退回「谁都能登」。

const GATE_URL = process.env.TEACHING_GATE_URL;
const GATE_SECRET = process.env.TEACHING_GATE_SECRET;

/**
 * 校验手机号是否被授权登录。
 * @param {string} phone 11 位手机号
 * @returns {Promise<boolean>} true = 在册且启用，可登录
 * @throws 当 gate 未配置或不可达时抛错（调用方据此返回 503，不放行）
 */
export async function checkPhoneAllowed(phone) {
  if (!GATE_URL || !GATE_SECRET) {
    throw new Error("TEACHING_GATE_URL / TEACHING_GATE_SECRET 未配置");
  }
  // admin-hub 配了 trailingSlash:true，API 路径必须以 / 结尾，否则 308 重定向。
  // 这里统一补尾斜杠，使 env 配不配尾斜杠都能命中、避免重定向丢 POST body。
  const url = GATE_URL.endsWith("/") ? GATE_URL : `${GATE_URL}/`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-gate-secret": GATE_SECRET,
    },
    body: JSON.stringify({ phone }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) {
    throw new Error(`gate 返回 HTTP ${res.status}`);
  }
  const data = await res.json().catch(() => ({}));
  return data.allowed === true;
}
