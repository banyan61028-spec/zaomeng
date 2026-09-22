# Design QA — 改版前端（frontend）

> 本文档记录改版前端 `frontend/` 的**视觉契约与验收结论**。
> 早期版本记录的是浅色 Lollipop 方案（结论 blocked），该方案已被**深色主题**取代，
> 相关内容仅保留在文末「历史」中。

## 范围

- 产品：XiaoYunQue / 造梦 本地 Web 应用
- 对象：**仅改版前端 `frontend/`**（原版 `xiaoyunque/xiaoyunque/frontend/` 不在范围内，保持不动）
- 实现地址：`http://127.0.0.1:3001`（`npm run dev`，默认 3000）
- 后端：`http://127.0.0.1:8000`（未启动时页面可打开，但依赖接口的区域会报错）
- 状态：桌面工作台 + 6 个功能页 + 主流程 6 阶段视图

## 视觉契约（唯一真源）

**`frontend/app/globals.css`** —— 以文件中的实际 Token 为准，不再引用外部设计文件
（旧文档引用的 `/Users/tianruian/Desktop/Lollipop-DESIGN.md` 已失效、与当前实现无关）。

风格定位：**深色 + 荧光绿强调**（参考 higgsfield.ai）。

| Token | 值 | 用途 |
|---|---|---|
| `--hf-bg` | `#0f1113` | 应用画布 |
| `--hf-surface` | `#1c1e20` | 卡片 / 输入框 / 顶栏 |
| `--hf-surface-2` | `#26282b` | 次级表面（内嵌区、禁用态） |
| `--hf-text` / `--hf-text-muted` / `--hf-text-dim` | `#f7f7f8` / `#a8a8a8` / `#7a7d80` | 文字层级 |
| `--hf-accent` | `#d1fe17` | 强调色（主按钮 / 选中态） |
| `--hf-accent-ink` | `#1a1a1a` | 强调色上的文字 |
| `--hf-accent-soft` | `rgba(209,254,23,.08)` | 强调色淡底 |
| `--hf-border` / `--hf-border-strong` | `rgba(255,255,255,.08)` / `.14` | 描边 |
| `--hf-radius-sm/md/lg/xl` | `8 / 10 / 12 / 20px` | 圆角 |

**必须满足的约束**

- 全站深色：不出现纯白 / 浅灰底，不出现遗留蓝色强调
- 主按钮＝荧光绿底 + 深色字；次按钮＝深色表面 + 细边框；选中态＝强调色淡底 + 强调色字
- 状态色保留语义（绿=完成、琥珀=警告、红=失败），按深底调亮
- 全局只有**一条顶栏**（`AppShell` 顶部导航），页面内不得再叠加同质顶栏
- 页面标题不被顶栏遮挡
- 保留既有路由、任务状态、上传、生成配置、历史与生成流程（只改视觉，不改逻辑）

## 验收方法

以**浏览器实测的计算样式**为准（而非仅看源码类名）：

1. 逐页读取关键元素的 `getComputedStyle()`，统计「浅色底」与「遗留蓝色」元素数量，要求均为 0
2. 覆盖全部 12 个视图：`/`、`/sandbox`、`/settings`、3 个 `/pipelines/*`，以及主流程
   6 个 stage（需历史会话：`/?session=<id>&stage=<stage>`；仅**只读**查看，不触发生成）
3. 检查标题元素是否被 `header` 覆盖（`elementFromPoint` 判定）
4. 滚动一次，确认 sticky 顶栏仍正确吸顶
5. `npx tsc --noEmit` 通过
6. 控制台无 error

## 结论

| 检查项 | 结果 |
|---|---|
| 浅色底残留 | 12/12 视图 = 0 ✅ |
| 遗留蓝色残留 | 12/12 视图 = 0 ✅ |
| 主/次按钮与选中态样式 | 符合契约 ✅ |
| 各 stage 自带紫/绿/玫红操作按钮 | 已统一为强调色方案 ✅ |
| 剧本页紫色渐变 CTA | 已统一为强调色 ✅ |
| 标题遮挡 | 无 ✅ |
| `tsc --noEmit` | 通过 ✅ |
| 控制台 error | 无（扩展注入类告警除外）✅ |

**final result: verified**

## 本轮修复的问题

1. **pipeline 页标题显示不全**
   根因：`PipelinePage` 根节点带 `overflow-y-auto`，形成嵌套滚动容器，使 `sticky top-16`
   的页头改为相对该容器计算而下移 64px，压住 H1。已移除该属性。
2. **hydration 不匹配告警**
   根因：浏览器扩展（`mpa-extension-id=…`）在 hydrate 前向 `<body>` 注入 `mpa-*` 属性，
   与业务代码无关。已按 React 官方建议在 `<body>` 上加 `suppressHydrationWarning`。
3. **顶栏冗余**
   `BrandHeader`（只有 Logo，与全局导航重复）已从 4 个页面移除并删除组件文件，
   功能页顶栏由 2 条减为 1 条。

## 说明与注意事项

- 验收在装有浏览器扩展的环境中完成；扩展带来的 `<body>` 属性差异已被抑制，不影响业务。
- 用 `127.0.0.1` 访问 dev server 需要 `next.config.ts` 的 `allowedDevOrigins` 放行，
  否则 `/_next/*` chunk 会 403，页面**不会 hydration**（表现为交互全失效）。
- 深色化目前依赖 `globals.css` 中的**兼容层**（把遗留浅色工具类映射到深色 Token）。
  新增组件请直接用 `--hf-*` Token；详见 `docs/09-前端骨架搭建方案.md`。

## 历史

- **早期迭代（已废弃）**：采用浅色 Lollipop 方案（`#FCFCFC` 画布 + 纯白表面 + 软黑主按钮 +
  扁平侧边栏），当期验收因无法获取浏览器渲染证据而标记为 `blocked`。
- **当前**：整体改为深色主题（`#0f1113` 画布 + `#d1fe17` 强调），壳层由侧边栏改为**顶部导航**；
  浅色 Lollipop 相关描述不再适用。
