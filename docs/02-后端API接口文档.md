# 02 · 后端 API 接口文档（完整契约）

> **基础 URL**：`http://localhost:8000`（前端开发时经 Next.js 代理用相对路径 `/api/...`，流式接口直连 `NEXT_PUBLIC_API_URL`）
> **认证**：无，全部公开。
> **错误格式**：`{"detail": "错误描述"}`，状态码 400/404/413/500 等。

## 0. 约定

- 所有产物文件路径为相对 `backend/code/` 的路径（如 `result/image/<session>/xxx.jpg`），前端通过 `/code/result/image/...` 访问。
- SSE 接口返回 `text/event-stream`，每个 `data:` 行是一个 JSON 对象。

---

## 1. 健康检查 / 元信息

### GET /api/health
返回 `{"status": "ok", "timestamp": 172...}`

### GET /
返回 `{"service": "XiaoYunQue", "version": "2.0.0", "health": "/api/health"}`

### GET /api/stages
返回 6 个阶段定义（顺序即主流程顺序）：
```json
{"stages": [
  {"id": "script_generation", "name": "剧本生成", "order": 1, "description": "..."},
  {"id": "character_design", "name": "角色/场景设计", "order": 2},
  {"id": "storyboard", "name": "分镜设计", "order": 3},
  {"id": "reference_generation", "name": "参考图生成", "order": 4},
  {"id": "video_generation", "name": "视频生成", "order": 5},
  {"id": "post_production", "name": "后期剪辑", "order": 6}
]}
```

---

## 2. 配置

### GET /api/config
返回脱敏后的配置（密钥显示为 `********` 或空）：
```json
{"config": {"project_name": "...", "server": {...}, "api_providers": {...}, "models": {...}, "generation": {...}},
 "path": "backend/config.yaml"}
```

### PUT /api/config
请求体：`{"values": { ...要更新的配置键值... }}`
返回：更新后的脱敏配置。

---

## 3. 会话列表

### GET /api/sessions
返回 `{"sessions": [ {id, idea, style, date, ...}, ... ]}`

### DELETE /api/sessions/{session_id}
删除单个会话，返回 `{"status": "deleted", "session_id": "..."}`

### DELETE /api/sessions
清理孤立结果文件。

---

## 4. 主流程（6 阶段工作流）★核心

### POST /api/project/start —— 创建项目
请求体（`ProjectStartRequest`）：
```json
{
  "idea": "失忆女刺客复仇",          // 必填
  "file_path": "docx文件名",         // 可选，上传文档后合并进 idea
  "style": "anime",                 // 可选
  "video_ratio": "9:16",            // 可选，默认 9:16
  "video_resolution": "720P",       // 可选
  "expand_idea": true,              // 可选，默认 true
  "llm_model": "qwen3.5-plus",      // 必填（后端校验）
  "vlm_model": "qwen3.5-plus",      // 必填
  "image_t2i_model": "doubao-seedream-5-0-260128", // 必填
  "image_it2i_model": "doubao-seedream-5-0-260128",// 必填
  "video_model": "wan2.7-i2v",      // 兼容旧字段（可选）
  "video_first_frame_model": "wan2.7-i2v",   // 按 video_generation_mode 选择，至少一个非空
  "video_start_end_model": "wan2.7-i2v",
  "video_reference_model": "wan2.7-r2v",
  "video_generation_mode": "first_frame",     // first_frame | start_end_frame | reference
  "enable_concurrency": true,
  "web_search": false,
  "episodes": 4
}
```
返回：
```json
{"session_id": "xxx", "status": {...阶段状态映射...}, "params": {...}}
```

> ⚠️ 后端会校验 `llm_model`/`vlm_model`/`image_t2i_model`/`image_it2i_model` 及当前视频模式对应模型非空，缺失返回 400。

### POST /api/project/{session_id}/execute/{stage} —— 执行阶段（SSE）
请求体可选（覆盖 session 参数），如 `{"style": "anime"}`。

SSE 事件（每行一个 JSON，类型见 `type` 字段）：
```json
{"type": "progress", "message": "...", "phase": "剧本生成", "step_desc": "...", "percent": 50}
{"type": "heartbeat"}
{"type": "stage_complete", "stage": "script_generation", "status": "completed", "requires_intervention": false, "payload_summary": {...}}
{"type": "error", "message": "..."}
{"type": "content", "content": "..."}
```

### GET /api/project/{session_id}/status —— 状态快照
```json
{
  "session_id": "xxx",
  "current_stage": "script_generation",
  "status": {"script_generation": "completed", "character_design": "pending", "...": "..."},
  "error": null,
  "artifacts": {...},          // 各阶段产物
  "meta": {...},               // 会话级参数
  "stage_progress": {...},     // 各阶段进度
  "updated_at": 177...
}
```
> 兼容旧路由：`GET /api/project/{session_id}/status/from_disk` 返回相同。

### GET /api/project/{session_id}/artifact/{stage} —— 获取阶段产物
```json
{"stage": "script_generation", "artifact": {...}}
```
未找到产物返回 404。

### PATCH /api/project/{session_id}/artifact/{stage} —— 保存选择/修改
请求体因阶段而异（详见 [03-数据模型](03-数据模型与产物格式.md) 的"PATCH 请求格式"）。
返回：`{"status": "ok", "status_map": {...}, "artifact": {...}}`

### POST /api/project/{session_id}/artifact/{stage}/upload_image —— 上传图片到产物
`multipart/form-data`：`item_type`、`item_id`、`file`。
返回：`{"status": "ok", "path": "...", "artifact": {...}, "status_map": {...}}`

### PATCH /api/project/{session_id}/models —— 更新会话模型参数
请求体：允许键 `llm_model, vlm_model, image_t2i_model, image_it2i_model, video_model, video_first_frame_model, video_start_end_model, video_reference_model, video_generation_mode, video_ratio, video_resolution, style, enable_concurrency`。
返回：`{"status": "ok", "meta": {...}}`

### POST /api/project/{session_id}/intervene —— 干预/重新生成（SSE）
请求体（`InterventionRequest`）：
```json
{"stage": "reference_generation", "modifications": {"regenerate_scenes": ["seg_01_01"]}}
```
`modifications` 常用键：`regenerate_characters` / `regenerate_settings` / `regenerate_scenes` / `regenerate_clips`（值为 id 列表）。SSE 格式同 `execute`。

### POST /api/project/{session_id}/continue —— 确认并进入下一阶段
返回：
```json
{"status": "ready", "next_stage": "character_design", "session_id": "...", "status_map": {...}}
```
或全部完成时 `{"status": "completed", ...}`。

### POST /api/project/{session_id}/stop —— 停止
返回 `{"status": "stopped", "session_id": "..."}`

### GET /api/project/{session_id}/scene/{scene_number}/assets —— 场景资产计数
返回 `{"scene_number": n, "reference_images": x, "videos": y, "shot_count": z}`

---

## 5. 文件上传

### POST /api/upload_file
`multipart/form-data`：`file`（仅 `.docx .doc .txt .md .pdf`，≤20MB）。
返回 `{"filename": "...", "file_path": "随机前缀_原名"}`

### POST /api/upload_media
`multipart/form-data`：`file`（`.jpg .jpeg .png .webp .bmp .mp4 .mov .avi .mkv .webm`，≤500MB）。
返回 `{"filename": "...", "file_path": "/绝对路径"}`

### DELETE /api/cache/temp
清空临时缓存，返回 `{"status": "ok", "deleted": n, "freed_mb": m, "errors": []}`

---

## 6. 模型列表

### GET /api/models
Query 可选：`media_type`(image|video)、`model_type`(llm|vlm|t2i|i2i|video)、`ability`、`verified_only`(bool)。
返回 `{"models": [ {id, label, provider, family, model_type/media_type, ability_type, ability_types, adapter_ability_types, input_modalities, adapter_input_modalities, api_contract_verified, capabilities} ]}`

### GET /api/pipelines/api-workflows
Query：`media_type`、`ability`、`verified_only`。返回 `{"workflows": [...]}`

---

## 7. 临时工作台 Sandbox

| 接口 | 说明 | 关键请求字段 |
|---|---|---|
| GET /api/sandbox/history | 历史记录（含 output） | - |
| GET /api/sandbox/tasks | 进行中的任务 | - |
| GET /api/sandbox/history/{id} | 单条详情 | - |
| DELETE /api/sandbox/history/{id} | 删除记录及文件 | - |
| POST /api/sandbox/llm | LLM 问答 | `{model, prompt, temperature?, web_search?}` |
| POST /api/sandbox/vlm | 图片理解 | `{model, prompt, images[]}` |
| POST /api/sandbox/t2i | 文生图 | `{model, prompt, style?, ratio?}` |
| POST /api/sandbox/i2i | 图生图 | `{model, prompt, image, ratio?}` |
| POST /api/sandbox/video | 视频生成 | `{model, prompt, image?}` |

通用返回：`{"success": true, "result": ..., "record_id": "..."}` 或 `{"success": false, "error": "..."}`。
产物路径已归一化为 `result/sandbox/...` 形式，前端经 `/code/result/sandbox/...` 访问。

---

## 8. Pipeline（一次性任务）

### GET /api/pipelines
返回 3 个 pipeline 元信息（id/name/description/aliases）。

### 创建任务（后台执行，无停点）
| 接口 | 用途 |
|---|---|
| POST /api/pipelines/standard/tasks | 文艺短视频 |
| POST /api/pipelines/action_transfer/tasks | 动作迁移 |
| POST /api/pipelines/digital_human/tasks | 数字人口播 |
| POST /api/pipelines/{pipeline}/tasks | 通用（`quick_create` 别名 → standard），体为 `{"params": {...}}` |

返回：`{"task_id": "...", "pipeline": "...", "status": "pending", "metadata_url": "/api/tasks/{id}", "output_dir": "..."}`

请求体字段（详见 `api/schemas/pipelines.py`）：

- **standard**（`StandardPipelineRequest`）关键字段：
  `text`(必填)、`mode`("copy"|...)、`title`、`segment_count`、`n_scenes`、`split_mode`、`llm_model`、`image_model`、`video_model?`、`video_mode`("image_concat"|"dynamic_video")、`video_ratio`、`image_resolution`、`generate_audio`、`generate_videos`、`enable_subtitles`、`subtitle_template`、`template_media_kind`、`video_duration`、`tts_voice`、`tts_speed` 等。
- **action_transfer**：`prompt_text`(必填)、`image_path`、`video_path`、`video_model`(必填)、`duration`、`video_ratio`、`resolution` 等。
- **digital_human**：`mode`、`character_image_path`(必填)、`goods_image_path?`、`goods_title?`、`goods_text?`、`llm_model`、`image_model`、`video_model`(必填)、`duration`、`video_ratio`、`tts_voice`、`tts_speed` 等。

### GET /api/pipelines/standard/templates
返回文艺短视频 HTML 模板列表（id/size/ratio/width/height/fields/preview_url）。

### GET /api/pipelines/standard/templates/{size}/{filename}/preview
返回模板预览 HTML。

### 任务查询
- `GET /api/tasks?limit=100` → `{"tasks": [...]}`
- `GET /api/tasks/{task_id}` → 任务详情（status/progress/input/output/artifacts/output_dir）
- `DELETE /api/tasks/{task_id}` → 删除任务及产物
- `GET /api/tasks/{task_id}/events` → **SSE** 进度订阅

Pipeline SSE 事件类型：`snapshot`（初始快照）/ `progress` / `artifact`（新产物，含 kind/name/path）/ `completed` / `failed`。

---

## 9. 静态产物访问

后端把 `backend/code/` 挂载到 `/code`。前端经 Next.js 代理访问：
```
/code/result/image/<session>/xxx.jpg
/code/result/video/<session>/xxx.mp4
/code/result/script/...
/code/result/task/<task_id>/...
/code/result/sandbox/...
```
