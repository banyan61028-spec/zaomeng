# 造梦（zaomeng）

> 从一句灵感，到一部成片 —— AI 短片创作系统

造梦把一段文字创意自动拆解为**剧本 → 角色/场景 → 分镜 → 参考图 → 视频 → 后期** 六个阶段，
每个阶段完成后都可人工确认或干预，最终输出一部完整短片。

## 功能

| 模块 | 说明 |
|---|---|
| **创作台** | 主流程 6 阶段，逐阶段生成与确认，支持重新生成、局部干预、多轮迭代 |
| **灵感速绘**（Sandbox） | 单次工具调用：LLM 对话 / 图片理解 / 文生图 / 图生图 / 视频生成 |
| **图文成片** | 输入灵感或完整文案，套用内置模版生成图片拼接或动态视频短片 |
| **动作复刻** | 用参考图片 + 动作视频生成动作迁移结果 |
| **AI口播** | 基于人物图片与文案生成口播视频 |
| **设置** | 模型注册、API 密钥、生成参数的可视化配置 |

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Next.js 16（App Router）+ React 19 + Tailwind CSS 4 + TypeScript |
| 后端 | Python 3.11 + FastAPI（端口 8000，产物挂载在 `/code/*`） |
| 模型接入 | 通过 `backend/config.yaml` 配置：OpenAI 兼容接口 / DashScope / Gemini / DeepSeek / 火山方舟 ARK / 可灵 Kling |
| 模版渲染 | Playwright + Chromium（把 HTML 模版渲染成成片画面） |

## 目录结构

```
zaomeng/
├── backend/                 # FastAPI 后端
│   ├── api/                 # 路由（project / pipelines / sandbox / tasks …）
│   ├── core/                # 编排器与 6 阶段 Agent
│   ├── models/              # 各模型客户端（LLM / 图像 / 视频 / VLM）
│   ├── pipelines/           # 一键 Pipeline（standard / action_transfer / digital_human）
│   ├── prompts/             # 提示词模板
│   ├── templates/           # 图文成片模版（HTML，按画幅分目录）
│   ├── config.yaml.example  # 配置模板（复制为 config.yaml 后填入密钥）
│   ├── requirements.txt
│   └── api_server.py        # 启动入口
├── frontend/                # Next.js 前端
│   ├── app/                 # 路由：/ · /sandbox · /settings · /pipelines/*
│   ├── components/          # AppShell / 主流程 / 6 阶段视图 / Pipeline / Sandbox
│   ├── lib/                 # 后端契约层（API 客户端、模型注册表）
│   ├── config/              # 前端常量（模型分组、灵感示例）
│   └── next.config.ts       # 代理与开发源配置
├── docs/                    # 开发文档（接口、数据模型、前端架构、部署…）
└── LICENSE
```

## 快速开始

### 1. 启动后端

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp config.yaml.example config.yaml # 然后填入你自己的模型 API Key
python api_server.py               # http://127.0.0.1:8000
```

健康检查：`curl http://127.0.0.1:8000/api/health`
接口文档：`http://127.0.0.1:8000/docs`

> 使用「图文成片」的 HTML 模版出片时还需要 Chromium：
> `pip install playwright && playwright install chromium`

### 2. 启动前端

```bash
cd frontend
npm install
npm run dev                        # http://localhost:3000
```

打开 `http://localhost:3000` 即可开始创作。

## 配置说明

- **后端配置**：`backend/config.yaml`（从 `config.yaml.example` 复制）
  包含各模型服务的 `api_key` / `base_url`、默认模型（`models.*`）与生成参数（`generation.*`）。
  **该文件含密钥，已在 `.gitignore` 中排除，请勿提交。**
  也可在前端「设置」页里可视化修改并保存。
- **前端环境变量**（可选）：
  - `BACKEND_API_URL`：Next 代理目标，默认 `http://127.0.0.1:8000`
  - `NEXT_PUBLIC_API_URL`：**SSE 流式接口**直连目标，默认 `http://127.0.0.1:8000`

## 设计系统

界面为**深色主题 + 荧光绿强调**（参考 higgsfield.ai），设计 Token 定义在 `frontend/app/globals.css`：

| Token | 值 | 用途 |
|---|---|---|
| `--hf-bg` | `#0f1113` | 应用画布 |
| `--hf-surface` | `#1c1e20` | 卡片 / 输入框 / 顶栏 |
| `--hf-text` | `#f7f7f8` | 主文本 |
| `--hf-text-muted` | `#a8a8a8` | 次级文本 |
| `--hf-accent` | `#d1fe17` | 强调色（主按钮 / 选中态） |
| `--hf-accent-ink` | `#1a1a1a` | 强调色上的文字 |
| `--hf-border` | `rgba(255,255,255,.08)` | 描边 |

**按钮规范**：主操作 = 强调色底 + 深色字；次操作 = 深色表面 + 细边框；选中态 = 强调色淡底 + 强调色字。

## 已知注意事项

1. **SSE 走直连**：`execute` / `intervene` / `tasks/{id}/events` 等流式接口由前端直连后端
   （`NEXT_PUBLIC_API_URL`），不走 Next 代理 —— 代理会缓冲响应导致 SSE 失效。
2. **用 `127.0.0.1` 访问 dev server** 需要 `next.config.ts` 的 `allowedDevOrigins` 放行，
   否则 `/_next/*` 资源会被 Next 16 的 dev 源校验拦截返回 403，表现为页面不响应（不会 hydration）。
3. 模版与产物路径均为相对 `backend/code/`，前端通过 `/code/*` 访问。

## 文档

`docs/` 目录下按主题拆分，建议从 `docs/README.md` 索引进入：

- `01-项目总览与架构` · `02-后端API接口文档` · `03-数据模型与产物格式`
- `04-前端架构与改造指南` · `05-模型注册与配置说明` · `06-部署与运行指南`
- `07-主流程交互时序图` · `08-前端API类型定义` · `09-前端：结构、设计系统与实施状态`
- `design-qa.md`：视觉契约与验收记录

## 致谢与许可

本项目基于以下开源项目二次开发，在此致谢：

- [XiaoYunQue](https://github.com/Innate-Labs/xiaoyunque)（上游 README 存档见 `docs/UPSTREAM-README.md`）
- [FilmAgent / Video-Claw](https://github.com/HITsz-TMG/FilmAgent)

均以 MIT License 发布，本项目同样以 **MIT License** 开源，详见 [LICENSE](LICENSE)。
