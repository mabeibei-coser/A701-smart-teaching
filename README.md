# 智能课件创作平台（smart-teaching）

AI 教学助手：高校教师输入教学主题，自动生成课堂互动方案（案例分析 / 正反辩论 / 角色扮演 / 项目探究 / 问题解决）等教学内容。
谨世ATA研究院使用 / 计划接入 admin-hub 管理后台（A701）。

## 技术栈
- 前端：React 18 + Vite 5 + MUI 5 + react-router-dom 7
- 后端：Express 4 + better-sqlite3（WAL）+ iron-session（手机号登录，无验证码）
- AI：讯飞 MaaS（astron-code-latest），调用在后端，密钥不暴露给浏览器

## 本地运行
1. 复制 `.env.local.example` 为 `.env.local`，填入讯飞 key 与会话密钥
2. `npm install`
3. `npm run dev` —— 同时起 Vite（前端 5173）+ Express（API 4701）
4. 打开 http://localhost:5173 ，输入手机号登录

## 环境变量（见 `.env.local.example`）
| 变量 | 说明 |
|---|---|
| `IFLYTEK_API_KEY` | 讯飞 MaaS key，格式 `APIKey:APISecret` |
| `IFLYTEK_API_URL` | 讯飞 chat completions 接口 |
| `IFLYTEK_MODEL` | 模型名，默认 `astron-code-latest` |
| `SMART_TEACHING_SESSION_PASSWORD` | iron-session 密钥（≥32 字符） |
| `SMART_TEACHING_COOKIE_SECURE` | HTTPS 经 HTTP 反代时设 `false` |
| `SMART_TEACHING_DB_PATH` | （可选）数据库路径，默认 `./data/smart-teaching.db` |
| `PORT` | API 端口，默认 `4701` |

## 数据库（`data/smart-teaching.db`，better-sqlite3 + WAL）
- `users(id, phone UNIQUE, created_at, last_login_at)`
- `reports(id, user_id, user_phone, created_at, type, topic, case_type, difficulty, params_json, report_json, duration_ms, ip, user_agent)`

每次「生成课堂互动方案」成功后写一条 `reports`，供 admin-hub 统计与按手机号反查。

## 待办（部署 / 接入 admin-hub 前）
- 🔴 原 `vite.config.js` 里硬编码的讯飞 TTI 密钥已泄露在公开 git，需作废重发
- 图片生成（课件页：讯飞 TTI / 豆包 / banana）目前仍走前端 + vite 代理，仅开发模式可用；
  部署前需搬到后端、密钥入 `.env.local`、并按需落库
- 接入 admin-hub：跑 `admin-hub-add-project` skill
