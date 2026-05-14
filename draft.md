# Personal Agent — Architecture Draft

## 定位

基于个人 memos 的轻量 AI agent，核心价值是**跨会话理解用户的性格、情绪和习惯**，而不只是检索笔记。

---

## 上下文三层（实际注入两层 + 按需工具）

### Layer 1 — System Prompt（用户编写）

- 单个 markdown 文件，定义 agent 的角色、语气、行为边界
- 存储：R2 固定 key `agent/PROMPT.md`

### Layer 2 — Memory Markdown（长期记忆）

- 单个 markdown 文件，记录关于用户的结构化认知：性格、偏好、情绪模式、重要事实
- 存储：R2 固定 key `agent/MEMORY.md`
- 用户可以预先手动填写（类似 Claude Desktop 的 CLAUDE.md）
- 每次对话开始时读取，注入 system prompt 的 `<memory>` 块

### Layer 3 — Memos（按需检索，不冷注入）

- 不在每次请求时预塞 memo 内容
- 通过 Tool Use 让 Claude 自行决定何时、搜什么
- 检索路径：D1 FTS（关键词匹配 excerpt）→ 命中 id → R2 读全文

---

## 记忆更新机制（内联 Tool Call，对标 Claude Desktop）

Claude Desktop 的真实行为：记忆更新发生在**同一次对话内**，通过 tool call 完成，不是事后单独发请求。

本项目采用相同机制，给 Claude 一个全量覆写工具：

```
update_memory(content: string)  // 传入完整新 markdown，直接覆写 MEMORY.md
```

全量覆写优于 add/remove：Claude 上下文中已有完整 memory，可以做语义整合而非只能机械追加，且 `remove` 依赖精确字符串匹配容易失效。

流程：Claude 生成回复时，若判断出现值得记住的信息，主动调用 `update_memory`，工具直接写入 R2，用户侧只看到流式文字输出。

---

## 工具集

这里的"工具"是 **Anthropic Messages API 的 Tool Use 功能**（即 function calling），在请求体的 `tools` 数组中定义，由开发者自己实现执行逻辑，不是 MCP 也不是任何官方插件。

| 工具                     | 作用                            |
| ------------------------ | ------------------------------- |
| `search_memos(query)`    | D1 FTS → R2 全文，按需检索 memo |
| `update_memory(content)` | 全量覆写 MEMORY.md              |

---

## 数据流

```
POST /api/chat
  → 读 R2: agent/PROMPT.md
  → 读 R2: agent/MEMORY.md
  → 组装 prompt: system(PROMPT.md) + <memory>(MEMORY.md) + 前端传入的 messages
  → Anthropic SDK streaming + tools
      tool_use: search_memos   → D1 FTS + R2 全文 → tool_result
      tool_use: update_memory  → R2 写入新内容 → tool_result
  → 文本 delta → SSE → 前端
```

---

## 需要新增的内容

### R2 对象

- `agent/PROMPT.md`：用户编写的 system prompt，初始为空
- `agent/MEMORY.md`：长期记忆，初始可为空或用户预填

### 路由

- `POST /api/chat`：主对话端点，流式 SSE，对话历史由前端维护并随请求传入
- `GET /PUT /api/agent/prompt`：PROMPT.md 读写
- `GET /PUT /api/agent/memory`：MEMORY.md 读写

### 页面

- `/chat`：对话主界面，使用 `ChatThread + ChatMessage + ChatInput`，历史仅保留在页面状态中
- `/settings`：设置页，编辑 PROMPT.md 和 MEMORY.md

---

## 关键决策记录

- **不做向量检索**：个人级别 memo 数量用 D1 FTS 足够，避免引入额外服务
- **不冷注入 memo**：改用 tool use，Claude 自行判断是否需要查笔记，降低 prompt 长度和置信度稀释
- **记忆全量覆写**：Claude 上下文中已有完整 memory，全量覆写可做语义整合，用户可随时手动编辑
- **对话历史不持久化**：由前端维护，随每次请求体传入，无需 D1 表，刷新页面即重置
