# CWFLY-ATC

CWFLY **管制中心**：ATC 席位工作台（管制在线状态、雷达/边界、排班与交接）。

## 组成
| 目录 | 说明 |
|---|---|
| `frontend/` | 管制端前端（Vue 3 + Vite） |
| `backend/` | 管制端 API（Express + Prisma） |
| `docs/` | 使用文档（VitePress） |
| `server.js` | 生产静态服务入口 |

## 快速开始
```bash
cd backend && cp .env.example .env && npm install && npm run dev
cd frontend && npm install && npm run dev
```

## 环境变量
见 `backend/.env.example`：`DATABASE_URL`、`JWT_SECRET`、`MAIN_API`（主站 API）、SMTP 等。
管制端与主站共库，读取 `FlightController` 在线快照与 `FlightPlan` 计划。

## 生产
```bash
npm run prod        # 构建 + 启动
```
Nginx 配置见 CWFLY-DEPLOY 仓库 `nginx/nginx-atc.conf`。
---
## 相关仓库

| 仓库 | 内容 |
|---|---|
| [CWFLY-WEB](https://github.com/yuanshen-123-ui/CWFLY-WEB) | 网站前后端（Vue3 + Express/Prisma） |
| [CWFLY-FSD](https://github.com/yuanshen-123-ui/CWFLY-FSD) | FSD 服务器（Python asyncio，FSD 协议） |
| [CWFLY-ATC](https://github.com/yuanshen-123-ui/CWFLY-ATC) | 管制中心（ATC 席位/雷达/排班） |
| [CWFLY-BOT](https://github.com/yuanshen-123-ui/CWFLY-BOT) | QQ 机器人（OneBot / NapCat） |
| [CWFLY-DOCS](https://github.com/yuanshen-123-ui/CWFLY-DOCS) | 文档站（VitePress） |
| [CWFLY-DEPLOY](https://github.com/yuanshen-123-ui/CWFLY-DEPLOY) | 部署脚本 / Nginx / SQL 迁移 |

> 本仓库由 CWFLY 主仓库于 2026-10-30 拆分而来，初始提交为当时快照（不含历史）。