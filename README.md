# CWFLY-ATC · 管制中心

CWFLY 的**管制员工作平台**：席位工作台、在线雷达、管制资料中心、培训与考试、模拟机预约、值班排班、报告与申请。前端 Vue 3，后端 Express + Prisma，与主站（[CWFLY-WEB](https://github.com/yuanshen-123-ui/CWFLY-WEB)）共库。

---

## 一、功能模块

| 模块 | 说明 |
|---|---|
| 登录 / OAuth | 账号密码登录，或跳转主站 OAuth 授权登录 |
| 工作台 Dashboard | 个人概览：等级、在线时长、待办（考试/模拟机/排班） |
| 在线雷达 | 读取主站 `FlightController` 在线快照，展示在线席位 |
| 考试中心 | 题库（单选/多选/判断）、组卷、在线答题、成绩与历史 |
| 模拟机 | 学员发起模拟机申请、教员审批（通过/驳回） |
| 值班排班 | 席位班次查看与申请、交接记录 |
| 管制资料中心 | VitePress 文档：频率、扇区、SOP、培训大纲、无线电通话、应急、移交、间隔 |
| 报告 / 申请 | 教员申请、事件报告 |

---

## 二、技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3 + Vite + Vue Router + Pinia，`src/views` 为页面、`src/components` 通用组件 |
| 后端 | Node.js + Express，JWT 鉴权（`middleware/auth.js`），Prisma 访问 MySQL |
| 文档 | VitePress（`docs/`，独立构建） |
| 部署 | `server.js` 静态 + API 服务；Nginx 见私有部署仓库 `nginx-atc.conf` |

---

## 三、目录结构

```
CWFLY-ATC/
├── backend/
│   ├── src/
│   │   ├── index.js          # 入口 + 全部 REST 路由（auth/questions/exams/sim-sessions/articles…）
│   │   ├── config.js         # 配置（读取 .env）
│   │   ├── prisma.js         # Prisma 客户端
│   │   ├── mailer.js         # SMTP 邮件
│   │   └── middleware/
│   │       └── auth.js       # JWT 鉴权 + 管理员/教员权限判定
│   ├── prisma/schema.prisma  # 与本服务相关的模型
│   └── .env.example
├── frontend/
│   ├── src/views/            # Login / OAuthCallback / Dashboard / ExamList / ExamTake / ExamHistory
│   │                         # Simulator / Schedule / Report / ApplyInstructor / ComingSoon / AppLayout
│   ├── src/components/       # 布局与通用组件
│   ├── src/router/           # 路由 + 守卫
│   └── public/               # 静态资源（login.html、logo）
├── docs/                     # VitePress 管制资料中心
│   ├── frequency/            # 频率：中国、区域
│   ├── sectors/              # 扇区：中国、东亚、东南亚、安装
│   ├── sop/                  # SOP：放行/地面/塔台/进近/区调
│   ├── guide/                # 指南：快速开始、席位、移交、间隔、通话、应急、排班
│   └── training/             # 培训：大纲、理论、实操、资源
├── server.js                 # 生产入口（API + 前端静态 + docs 静态）
└── package.json              # dev / build / start / prod
```

---

## 四、后端 API

| 方法 | 路径 | 权限 | 说明 |
|---|---|---|---|
| POST | `/api/auth/login` | 公开 | 账号密码登录，返回 JWT |
| POST | `/api/auth/oauth/login` | 公开 | 主站 OAuth 回调换取本服务令牌 |
| GET | `/api/auth/profile` | 登录 | 当前用户资料与等级 |
| GET/POST/PUT/DELETE | `/api/questions` | 登录 / 管理员 | 题库管理 |
| GET/POST/PUT/DELETE | `/api/exams` | 登录 / 管理员 | 考试（组卷）管理 |
| POST | `/api/exams/:id/submit` | 登录 | 提交答卷、自动判分 |
| GET | `/api/exam-attempts` | 登录 | 个人考试记录 |
| GET/POST | `/api/sim-sessions` | 登录 | 模拟机申请/查询 |
| PUT | `/api/sim-sessions/:id/status` | 教员 | 审批模拟机申请 |
| GET/POST | `/api/articles` | 登录 / 管理员 | 管制资料文章 |
| POST | `/api/articles/upload` | 管理员 | 文章附件上传 |

> 权限中间件：`authenticate`（登录态）→ `requireAdmin`（管理员）→ `requireInstructor`（教员）。

---

## 五、环境变量

`backend/.env`（复制 `.env.example`）：

| 变量 | 必填 | 说明 |
|---|---|---|
| `DATABASE_URL` | ✅ | MySQL 连接串（与主站同库） |
| `JWT_SECRET` | ✅ | 本服务 JWT 签名密钥 |
| `PORT` | | 服务端口（默认 3002 左右，见 `.env.example`） |
| `MAIN_API` | | 主站 API 地址（OAuth/在线快照） |
| `SMTP_HOST/PORT/USERNAME/PASSWORD/FROM_EMAIL/FROM_NAME` | | 邮件通知（模拟机审批/考试） |

---

## 六、本地开发

```bash
# 后端
cd backend
cp .env.example .env         # 填 DATABASE_URL / JWT_SECRET / MAIN_API / SMTP
npm install
npm run dev                  # Express API

# 前端
cd frontend
npm install
npm run dev                  # Vite dev server

# 文档中心（可选）
cd docs
npm install && npm run dev
```

## 七、构建与部署

```bash
npm run build      # 构建前端（frontend/dist）
npm run prod       # 生产启动（构建 + server.js）
pm2 reload cwfly-atc        # 前端/API 进程
pm2 reload cwfly-atc-api    # 仅后端 API 时
```

- 与主站共用数据库：**只读**主站的 `FlightController`（在线席位）、`FlightPlan`（计划）与 `User`（等级）

---

## 八、常见问题

| 现象 | 处理 |
|---|---|
| 登录后立刻 401 | `JWT_SECRET` 不一致 / 令牌过期 |
| OAuth 登录失败 | `MAIN_API` 地址错误，或主站未放行回调域名 |
| 看不到在线席位 | 主站 `FlightController` 无数据（无人上线）或库连接失败 |
| 文档中心 404 | `docs` 未构建或 Nginx 未配置 `/atc/docs` 路径 |
| 模拟机审批按钮不显示 | 当前账号无教员权限（`requireInstructor`） |

---

## 九、相关仓库

| 仓库 | 内容 |
|---|---|
| [CWFLY-WEB](https://github.com/yuanshen-123-ui/CWFLY-WEB) | 主站（共库、OAuth、在线数据来源） |
| [CWFLY-FSD](https://github.com/yuanshen-123-ui/CWFLY-FSD) | FSD 连线服务器 |
| [CWFLY-BOT](https://github.com/yuanshen-123-ui/CWFLY-BOT) | QQ 机器人 |
| [CWFLY-DOCS](https://github.com/yuanshen-123-ui/CWFLY-DOCS) | 面向用户的文档站（本仓库 `docs/` 是管制资料中心，二者不同） |

