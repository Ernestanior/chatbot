# SocialAI — AI 驱动的社交媒体客服 SaaS 平台

## 项目概述

SocialAI 是一个面向品牌商家的 AI 自动客服平台，支持 Instagram 和 Facebook 双平台，提供智能自动回复、留言触发私讯、讯息中心、效果分析等核心功能。灵感来源于 FRIDAI，定位为可独立部署的 MVP 产品。

## 技术栈

| 层级 | 技术选型 |
|------|----------|
| 框架 | Next.js 16 (App Router) + TypeScript |
| UI | Tailwind CSS 4 + shadcn/ui + Radix UI |
| 数据库 | PostgreSQL 16 + Prisma 7 ORM |
| 消息队列 | BullMQ + Redis 7 (ioredis) |
| AI 引擎 | 多供应商抽象层 (Claude + OpenAI)，3 级降级链 |
| 认证 | NextAuth v5 (beta) + Facebook OAuth |
| 测试 | Vitest 4，57 个测试用例 |
| 部署 | Docker + docker-compose |

## 系统架构

```
┌─────────────────────────────────────────────────────┐
│                    Next.js App                       │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Dashboard │  │ API Routes│  │ Webhook Receiver │  │
│  │   (UI)   │  │  (25+)   │  │  (Meta Events)   │  │
│  └──────────┘  └──────────┘  └───────────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │PostgreSQL│ │  Redis   │ │ Meta API │
    │ (Prisma) │ │ (BullMQ) │ │ (Graph)  │
    └──────────┘ └────┬─────┘ └──────────┘
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
    ┌───────────┐┌──────────┐┌──────────┐
    │ Incoming  ││ Send     ││ Quality  │
    │ Message   ││ Reply    ││ Check    │
    │ Worker    ││ Worker   ││ Worker   │
    └───────────┘└──────────┘└──────────┘
          ┌───────────┴───────────┐
          ▼                       ▼
    ┌───────────┐          ┌───────────┐
    │ Summarize │          │ Comment   │
    │ Worker    │          │ Trigger   │
    └───────────┘          └───────────┘
```

## 数据库模型 (20 张表)

| 分类 | 模型 | 说明 |
|------|------|------|
| 认证 | User, Account, Session, VerificationToken | NextAuth 标准模型 |
| 多租户 | Brand, BrandMember | 品牌隔离 + 角色权限 (OWNER/ADMIN/EDITOR/VIEWER) |
| 平台 | PlatformAccount | IG/FB 授权帐号，Token 加密存储 |
| 笔记本 | NotebookSection, NotebookVersion, NotebookConfig | 7 模块 AI 规则 + 版本快照 |
| 回复 | ReplySettings | 频率限制、休息时间、打字延迟等 |
| 对话 | Conversation, Message | 多状态 (AI_ACTIVE/HUMAN_TAKEOVER/CLOSED)，多消息类型 |
| 触发 | CommentTrigger | 留言触发私讯规则 (HASHTAG/KEYWORD) |
| 质量 | UncoveredTopic | AI 未覆盖话题收集 |
| 客户 | CustomerProfile | 自动画像 + 标签 + 互动统计 |
| 媒体 | MediaLibrary | 品牌素材库 |
| 测试 | TestCase, TestRun, TestRunResult | AI 回复回归测试 |

## 功能模块详解

### 1. AI 规则笔记本

品牌通过 7 个独立模块定义 AI 行为规则：

- **品牌资讯** — 公司名称、简介、核心价值
- **产品目录** — 产品名称、价格、特色、常见问题
- **FAQ** — 常见问答对
- **语气风格** — 回复语气、用词偏好、emoji 使用
- **升级规则** — 何时转交真人处理
- **离题处理** — 非业务相关问题的应对策略
- **自定义** — 任意扩展规则

支持：版本快照、AI 自检（检测规则冲突/遗漏）、引导式创建向导。

### 2. 自动回复引擎

消息处理流程：

```
Meta Webhook → POST /api/webhook/meta
  → 解析事件 (FB Messaging / IG Messaging / IG Comments)
  → 入队 BullMQ (incoming-message / comment-trigger)
  → incoming-message worker:
      1. 查找/创建 Conversation
      2. 存储 Message
      3. 更新 CustomerProfile
      4. 检查 ReplySettings (频率/休息时间/概率)
      5. 构建 Prompt (笔记本规则 + 对话上下文 + 客户画像)
      6. AI 生成回复 (3 级降级: 主 → 备 → 兜底消息)
      7. 入队 send-reply
      8. 入队 quality-check + summarize
  → send-reply worker:
      1. 检查 Meta API 限流状态
      2. 解密 Token → 调用 Meta Graph API 发送
      3. 更新 Message.platformMessageId
  → quality-check worker:
      1. AI 评估回复质量 → 标记 qualityFlags
      2. 收集未覆盖话题 → UncoveredTopic
  → summarize worker:
      1. AI 生成对话摘要 → 更新 Conversation.summary
```

### 3. 留言触发私讯

当用户在 IG/FB 贴文下留言时，自动匹配触发规则：

- **Hashtag 匹配** — 留言包含指定 hashtag（如 `#想要`）
- **Keyword 匹配** — 留言包含指定关键词（支持多关键词 OR）
- 可限定特定贴文 (`postId`) 或全局生效
- 触发后自动：回复留言 + 发送私讯（固定文案或 AI 生成）

### 4. 讯息中心

三栏式 UI：对话列表 | 聊天详情 | 客户资讯

- 对话列表支持分页、状态筛选 (AI_ACTIVE / HUMAN_TAKEOVER / CLOSED)
- SSE 实时推送新消息
- 真人接管：点击后 AI 停止自动回复，人工直接发送
- 关闭/重新激活对话

### 5. 效果分析仪表板

- KPI 卡片：总对话数、AI 回复数、真人接管率、平均响应时间
- 未覆盖话题列表（按出现次数排序）
- 按时间范围筛选

### 6. AI 降级链

```
主 AI (如 OpenAI) → 备用 AI (如 Claude) → 兜底静态消息
```

每级超时或报错自动切换下一级，确保用户始终收到回复。

## API 路由一览

| 路径 | 方法 | 说明 |
|------|------|------|
| `/api/brands` | GET/POST | 品牌列表 / 创建品牌 |
| `/api/notebook/sections` | GET/PUT | 笔记本模块 CRUD |
| `/api/notebook/toggle` | POST | 启用/停用 AI 自动回复 |
| `/api/notebook/versions` | GET | 笔记本版本历史 |
| `/api/notebook/lint` | POST | AI 自检规则质量 |
| `/api/notebook/wizard` | POST | AI 引导式创建笔记本 |
| `/api/test/simulate` | POST | 模拟 AI 回复测试 |
| `/api/platform/discover` | GET | 发现可连接的 IG/FB 帐号 |
| `/api/platform/accounts` | GET/POST/DELETE | 平台帐号管理 |
| `/api/settings/reply` | GET/PUT | 回复行为设定 |
| `/api/conversations` | GET | 对话列表（分页 + 筛选） |
| `/api/conversations/[id]` | GET/PATCH | 对话详情 / 状态更新 |
| `/api/conversations/[id]/messages` | GET/POST | 消息列表 / 人工发送 |
| `/api/conversations/[id]/stream` | GET | SSE 实时消息流 |
| `/api/comment-triggers` | GET/POST | 留言触发规则列表 / 创建 |
| `/api/comment-triggers/[id]` | PUT/DELETE | 更新 / 删除触发规则 |
| `/api/insights` | GET | 效果统计数据 |
| `/api/webhook/meta` | GET/POST | Meta Webhook 验证 / 接收事件 |
| `/api/health` | GET | 健康检查 (DB + Redis) |

## 前端页面

| 路径 | 说明 |
|------|------|
| `/login` | Facebook OAuth 登录 |
| `/` | Dashboard 首页（品牌切换器） |
| `/brands` | 品牌管理 |
| `/notebook` | AI 规则笔记本编辑器 |
| `/messages` | 讯息中心（三栏式） |
| `/triggers` | 留言触发私讯管理 |
| `/insights` | 效果分析仪表板 |
| `/settings/auth` | 平台帐号连接 (IG/FB) |
| `/settings/reply` | 回复行为设定 |

## Worker 进程

5 个独立 Worker，通过 BullMQ 消费 Redis 队列：

| Worker | 队列 | 并发 | 重试 | 说明 |
|--------|------|------|------|------|
| incoming-message | `incoming-message` | 5 | 3 次 | 处理收到的消息，生成 AI 回复 |
| send-reply | `send-reply` | 3 | 2 次 | 调用 Meta API 发送消息 |
| quality-check | `quality-check` | 2 | 2 次 | AI 评估回复质量 |
| summarize | `summarize` | 2 | 2 次 | AI 生成对话摘要 |
| comment-trigger | `comment-trigger` | 3 | 2 次 | 留言匹配 → 回复 + 私讯 |

所有 Worker 支持：
- 指数退避重试 (backoff: exponential)
- Dead Letter Queue 日志（耗尽重试后记录 fatal 级别日志）
- 优雅关闭 (SIGINT/SIGTERM)

## 安全机制

- **Token 加密** — PlatformAccount.accessToken 使用 AES-256-GCM 加密存储
- **API 速率限制** — Redis 滑动窗口，3 个档位：标准 60/min、Webhook 200/min、AI 20/min
- **Meta API 限流保护** — 收到 429 后自动设 60s 冷却期，期间所有发送 job 延迟重试
- **认证中间件** — 所有 Dashboard API 路由强制 NextAuth session 校验
- **Webhook 验证** — Meta verify_token 校验

## 错误处理

- `AppError` 类 — 统一错误码体系 (UNAUTHORIZED / NOT_FOUND / VALIDATION_ERROR / RATE_LIMITED / META_API_ERROR / AI_ERROR / INTERNAL_ERROR)
- `apiHandler` 包装器 — 所有 API 路由自动处理认证、Prisma 错误分类、结构化 JSON 响应、请求计时
- Worker 结构化日志 — JSON 格式，包含 worker 名称、jobId、错误详情
- `isTransientError` — 区分可重试 vs 永久性错误

## 测试覆盖

57 个测试用例，6 个测试文件，全部通过：

| 测试文件 | 覆盖范围 |
|----------|----------|
| `encryption.test.ts` | AES-256-GCM 加解密、空值处理、密钥错误检测 |
| `prompt-builder.test.ts` | 笔记本规则组装、模块启停、排序、空内容处理 |
| `ai-fallback.test.ts` | 3 级降级链、超时切换、全部失败兜底 |
| `webhook-validation.test.ts` | Meta Webhook 事件解析、签名验证 |
| `comment-trigger.test.ts` | Hashtag/Keyword 匹配、大小写、postId 过滤 |
| `incoming-message.test.ts` | 消息处理辅助函数、频率检查、休息时间判断 |

运行命令：`npm test`

## 部署

### Docker Compose（推荐）

```bash
# 1. 复制环境变量
cp .env.example .env
# 编辑 .env 填入 Meta App、AI API Key、加密密钥等

# 2. 启动所有服务
docker compose up -d

# 3. 执行数据库迁移
docker compose exec app npx prisma migrate deploy

# 4. 查看日志
docker compose logs -f app workers
```

服务组成：

| 服务 | 镜像 | 端口 | 说明 |
|------|------|------|------|
| app | 自建 (Dockerfile) | 3000 | Next.js 应用 |
| workers | 自建 (Dockerfile.workers) | — | BullMQ Worker 进程 |
| postgres | postgres:16-alpine | 5432 | 数据库 |
| redis | redis:7-alpine | 6379 | 消息队列 + 缓存 |

### 环境变量

```bash
# 必填
DATABASE_URL="postgresql://socialai:socialai_dev@localhost:5432/socialai"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<openssl rand -base64 32>"
META_APP_ID="<Facebook App ID>"
META_APP_SECRET="<Facebook App Secret>"
ENCRYPTION_KEY="<openssl rand -hex 32>"

# AI (至少填一个)
AI_PROVIDER="OPENAI"          # 主 AI
AI_BACKUP_PROVIDER="CLAUDE"   # 备用 AI
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""
```

### 健康检查

```bash
curl http://localhost:3000/api/health
# → { "status": "healthy", "db": { "latencyMs": 2 }, "redis": { "latencyMs": 1 } }
```

## 项目结构

```
socialai/
├── prisma/schema.prisma          # 数据库模型 (20 表)
├── src/
│   ├── middleware.ts              # Edge 路由保护
│   ├── app/
│   │   ├── (auth)/login/         # 登录页
│   │   ├── (dashboard)/          # Dashboard 布局 + 所有页面
│   │   └── api/                  # 25+ API 路由
│   ├── components/ui/            # shadcn/ui 组件
│   ├── lib/
│   │   ├── ai/                   # AI 抽象层 (Claude/OpenAI/Prompt Builder)
│   │   ├── auth.ts               # NextAuth 配置
│   │   ├── db.ts                 # Prisma Client
│   │   ├── redis.ts              # ioredis 实例
│   │   ├── queue.ts              # BullMQ 队列定义
│   │   ├── encryption.ts         # AES-256-GCM 加解密
│   │   ├── errors.ts             # AppError + 错误分类
│   │   ├── api-handler.ts        # API 路由统一包装器
│   │   ├── rate-limit.ts         # Redis 滑动窗口限流
│   │   ├── meta.ts               # Meta Graph API 调用
│   │   └── meta-send.ts          # FB/IG 消息发送
│   └── workers/                  # 5 个 BullMQ Worker
├── docker-compose.yml            # 4 服务编排
├── Dockerfile                    # Next.js 多阶段构建
├── Dockerfile.workers            # Worker 独立镜像
└── vitest.config.ts              # 测试配置
```

## 设计决策

| 决策 | 理由 |
|------|------|
| 模块化笔记本 vs 单一文本框 | 降低用户学习曲线，结构化数据便于 AI 理解 |
| 3 级 AI 降级链 | 确保 100% 回复率，单一供应商故障不影响服务 |
| BullMQ 异步处理 | Meta 要求 Webhook 20s 内响应，重计算必须异步 |
| Worker 独立容器 | 可独立水平扩展，不影响 Web 服务 |
| 客户画像 + 对话摘要 | 轻量级客户记忆，无需完整 CRM |
| 质量检测 + 未覆盖话题 | 持续改进闭环，自动发现笔记本盲区 |
| Redis 滑动窗口限流 | 比固定窗口更平滑，防止边界突发 |
| AES-256-GCM 加密 Token | 数据库泄露不暴露平台授权 |

## 后续规划

- [ ] 数据库 Migration + Seed 数据
- [ ] 生产环境部署 (AWS ECS / Railway / Vercel + 独立 Worker)
- [ ] 监控告警 (Sentry / CloudWatch)
- [ ] 自动发帖功能
- [ ] CRM 集成 (HubSpot / Salesforce)
- [ ] 多语言支持
- [ ] 进阶分析 (情感分析、响应时间趋势、客户满意度)
