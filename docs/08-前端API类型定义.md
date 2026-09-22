# 08 · 前端 API 类型定义（workflowApi.ts 拆解）

> 本文是 `frontend/lib/workflowApi.ts` 的完整类型契约，新前端可直接复制这些 TypeScript 类型与函数签名。

## 1. 核心类型

```ts
export interface StageInfo {
  id: string;
  name: string;
  order: number;
  description: string;
}

export interface ProjectStatus {
  session_id: string;
  current_stage: string;
  status: Record<string, string>;   // 每阶段一个状态
  error: string | null;
}

export interface StreamEvent {
  type: 'progress' | 'heartbeat' | 'stage_complete' | 'error' | 'content';
  message?: string;
  phase?: string;
  step_desc?: string;
  percent?: number;
  stage?: string;
  status?: string;
  requires_intervention?: boolean;
  payload_summary?: any;
  content?: string;
  time?: number;
  data?: any;
}

export interface PipelineTask {
  task_id: string;
  pipeline: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | string;
  progress?: number;
  message?: string;
  input?: Record<string, any>;
  output?: Record<string, any>;
  artifacts?: Array<{ kind: string; name?: string; path: string; exists?: boolean; created_at?: string }>;
  error?: string | null;
  created_at?: string;
  updated_at?: string;
  output_dir?: string;
}

export interface SandboxTask {
  id: string;
  tool: string;
  model: string;
  input?: Record<string, any>;
  status: string;
  progress?: number;
  created_at?: string;
}

export interface PipelineStartResponse {
  task_id: string;
  pipeline: string;
  status: string;
  metadata_url: string;
  output_dir: string;
}

export interface PipelineTaskEvent {
  type: 'snapshot' | 'progress' | 'artifact' | 'completed' | 'failed';
  task_id: string;
  status?: string;
  progress?: number;
  artifact?: { kind: string; name?: string; path: string; exists?: boolean; created_at?: string };
}

export interface ApiModelOption {
  id: string;
  label: string;
  provider: string;
  family?: string;
  media_type?: 'image' | 'video';
  model_type?: 'llm' | 'vlm' | 't2i' | 'i2i' | 'video';
  type?: string[];
  ability_type?: string;
  ability_types?: string[];
  adapter_ability_types?: string[];
  input_modalities?: string[];
  adapter_input_modalities?: string[];
  api_contract_verified?: boolean;
  capabilities?: Record<string, any>;
}

export interface StandardTemplateOption {
  id: string;
  name: string;
  label: string;
  size: string;
  ratio: '9:16' | '1:1' | '16:9' | string;
  width: number;
  height: number;
  media_width: number;
  media_height: number;
  media_ratio: string;
  media_resolution: string;
  supports_video?: boolean;
  fields: Array<{ key: string; type: string; default: string }>;
  preview_url: string;
}
```

## 2. 函数签名（按领域分组）

### 2.1 主流程

```ts
startProject(params: {
  idea: string;
  file_path?: string;
  style?: string;
  video_ratio?: string;
  video_resolution?: string;
  llm_model?: string;
  vlm_model?: string;
  image_t2i_model?: string;
  image_it2i_model?: string;
  video_model?: string;
  video_first_frame_model?: string;
  video_start_end_model?: string;
  video_reference_model?: string;
  video_generation_mode?: string;
  scene_number?: number;
  enable_concurrency?: boolean;
  web_search?: boolean;
  expand_idea?: boolean;
  episodes?: number;
}): Promise<{ session_id: string; status: string; params: any }>

getProjectStatus(sessionId: string): Promise<ProjectStatus>
getProjectStatusFromDisk(sessionId: string): Promise<any>
getArtifact(sessionId: string, stage: string): Promise<any>
checkSceneAssets(sessionId: string, sceneNumber: number): Promise<{scene_number:number;reference_images:number;videos:number;shot_count:number}>

executeStage(sessionId: string, stage: string, inputData?: Record<string, any>, signal?: AbortSignal): Promise<Response>  // SSE
intervene(sessionId: string, stage: string, modifications: Record<string, any>): Promise<Response>                    // SSE
stopProject(sessionId: string): Promise<{ status: string }>
continueWorkflow(sessionId: string): Promise<{ status: string; next_stage?: string }>
updateModels(sessionId: string, models: Partial<Record<string, string | boolean>>): Promise<{ status: string }>
saveSelections(sessionId: string, stage: string, selections: Record<string, any>): Promise<{ status: string }>
uploadArtifactImage(sessionId: string, stage: string, itemType: string, itemId: string, file: File): Promise<{status:string;path:string;artifact:any;status_map:Record<string,string>}>
deleteSession(sessionId: string): Promise<{ status: string }>
```

### 2.2 SSE 解析器

```ts
parseStreamEvents(response: Response): AsyncGenerator<StreamEvent>
// 逐行 JSON 解析；stage_complete/error 为终态；heartbeat 被过滤；
// 若流结束未收到终态则 throw。
```

### 2.3 阶段 / 会话 / 模型

```ts
fetchStages(): Promise<StageInfo[]>
fetchSessions(): Promise<any[]>
fetchApiModels(params?: {
  mediaType?: 'image' | 'video';
  modelType?: 'llm' | 'vlm' | 't2i' | 'i2i' | 'video';
  ability?: string;
  verifiedOnly?: boolean;
}): Promise<ApiModelOption[]>
```

### 2.4 Pipeline

```ts
startStandardPipeline(params: Record<string, any>): Promise<PipelineStartResponse>
startActionTransferPipeline(params: Record<string, any>): Promise<PipelineStartResponse>
startDigitalHumanPipeline(params: Record<string, any>): Promise<PipelineStartResponse>
fetchPipelineTasks(limit?: number): Promise<PipelineTask[]>
fetchPipelineTask(taskId: string): Promise<PipelineTask>
deletePipelineTask(taskId: string): Promise<void>
fetchStandardTemplates(): Promise<StandardTemplateOption[]>
subscribePipelineTask(taskId: string, onEvent: (e: PipelineTaskEvent) => void, onError?: () => void): () => void  // 返回取消订阅函数
```

### 2.5 Sandbox

```ts
fetchSandboxTasks(): Promise<SandboxTask[]>
// 注：Sandbox 具体生成调用（llm/vlm/t2i/i2i/video）在 components/Sandbox 内直接 fetch /api/sandbox/*
```

### 2.6 文件 / 缓存

```ts
uploadMedia(file: File): Promise<{ filename: string; file_path: string }>
// uploadFile 类似（前端文档上传时直接 fetch /api/upload_file）
clearTempCache(): Promise<{status:string;deleted:number;freed_bytes?:number;freed_mb?:number;errors?:Array<{path:string;error:string}>}>
```

## 3. 关键实现细节

- **两个 base**：非流式接口走相对路径 `/api/...`（经 Next rewrites 代理）；流式接口用 `STREAM_API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'` 直连。
- **错误归一**：`requireOkResponse(resp, fallback)` 解析 `{detail}` 或 fallback，抛 `Error`。
- **Pipeline 事件订阅**：用 `EventSource`，`onmessage` 解析 JSON 交给 `onEvent`，`onerror` 调 `onError` 并 close；返回清理函数。
- **上传**：`FormData`，字段名 `file`；artifact 图片上传额外带 `item_type`/`item_id`。

## 4. 复用建议

重写前端时，**推荐整体复制 `workflowApi.ts`**（它是与后端最精确对齐的契约），只替换 UI 层调用方式。若换框架（如 Vite+React），也只需把相对路径 `/api/...` 改为完整后端地址（或配置同源代理），函数体基本不动。
