import { getIronSession } from "iron-session";

export const sessionOptions = {
  password: process.env.SMART_TEACHING_SESSION_PASSWORD,
  cookieName: "smart_teaching_user_session",
  cookieOptions: {
    secure:
      process.env.SMART_TEACHING_COOKIE_SECURE !== "false" &&
      process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    path: process.env.SMART_TEACHING_COOKIE_PATH || "/",
    maxAge: 60 * 60 * 24 * 30, // 30 天
  },
};

export async function getSession(req, res) {
  if (!sessionOptions.password) {
    throw new Error("SMART_TEACHING_SESSION_PASSWORD env 未配置");
  }
  return getIronSession(req, res, sessionOptions);
}
