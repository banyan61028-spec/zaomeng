# XiaoYunQue（小云雀）开发文档索引

> 本目录是针对「**保留后端、重写/改造前端**」这一目标整理的项目开发必备文档。
> 后端当作稳定黑盒使用，前端可整体重写，只需保证与后端 API 契约一致。

## 文档清单

| 文档 | 内容 | 什么时候读 |
|---|---|---|
| [01-项目总览与架构](01-项目总览与架构.md) | 产品定位、技术栈、目录结构、整体数据流 | 上手第一步必读 |
| [02-后端API接口文档](02-后端API接口文档.md) | 全部 REST / SSE 接口、请求响应格式 | **重写前端时最重要，接口即契约** |
| [03-数据模型与产物格式](03-数据模型与产物格式.md) | Session JSON、6 阶段 artifact 结构、跨阶段同步 | 前端要渲染各阶段产物时 |
| [04-前端架构与改造指南](04-前端架构与改造指南.md) | 现有前端页面/组件/API 客户端、如何重写 | 改前端时必读 |
| [05-模型注册与配置说明](05-模型注册与配置说明.md) | config.yaml、模型注册表、能力标签、三种视频模式 | 做设置页/模型选择时 |
| [06-部署与运行指南](06-部署与运行指南.md) | 环境要求、安装、启动、常见问题 | 跑起来/联调时 |
| [07-主流程交互时序图](07-主流程交互时序图.md) | 前后端交互时序、状态机、SSE 事件、重生成流程 | 理解整体节奏时 |
| [08-前端API类型定义](08-前端API类型定义.md) | workflowApi.ts 的完整类型与函数签名 | 重写前端/换框架时 |
| [09-改版前端（frontend）](09-前端骨架搭建方案.md) | frontend 结构、深色设计系统、兼容层、本地踩坑与自检清单 | 改新版前端时 |

## 三个快速入口

- **接口全量**：后端启动后访问 `http://localhost:8000/docs`（Swagger）/ `http://localhost:8000/openapi.json`
- **前端 API 客户端**（可直接复用/对齐）：`xiaoyunque/xiaoyunque/frontend/lib/workflowApi.ts`
- **后端旧文档**：`xiaoyunque/xiaoyunque/backend/docs/api.md`、`session_format.md`（部分字段已过时，以本目录为准）

## 关键事实速记

- 后端：Python 3.11 + FastAPI，端口 **8000**，无鉴权，产物挂载在 `/code/*`
- 前端：Next.js 16 + React 19 + Tailwind CSS 4，端口 **3000**
- **改版前端** `frontend/`：深色主题（画布 `#0f1113`、强调色 `#d1fe17`），设计 Token 与兼容层见 `frontend/app/globals.css`；用 `127.0.0.1` 访问 dev server 需 `allowedDevOrigins` 放行，否则 `/_next/*` 会 403、页面不会 hydration（详见文档 09）
- 前端通过 Next.js `rewrites` 把 `/api/*`、`/code/*` 代理到后端；**SSE 流式接口**（`execute`/`intervene`/`tasks/{id}/events`）走 `NEXT_PUBLIC_API_URL`（默认 `http://127.0.0.1:8000`）直连，因为代理会缓冲导致 SSE 失效
- 主流程 6 阶段：`script_generation` → `character_design` → `storyboard` → `reference_generation` → `video_generation` → `post_production`
- 产物目录：`backend/code/`（`result/image|video|script|sandbox|task`、`data/sessions/`、`data/tasks/`）
