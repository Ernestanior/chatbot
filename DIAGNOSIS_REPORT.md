# Facebook 消息回复问题诊断报告

## 问题描述
Facebook Page "Chaterntest" 收到消息后，AI 没有自动回复。

## 诊断过程

### 1. 环境检查 ✅
- 所有必需的环境变量都已正确配置
- DATABASE_URL, META tokens, AI API keys 都存在

### 2. 数据库配置检查

#### 品牌配置 ✅
- 品牌: **小样奶茶店** (ID: `cmmis0j9k000104l1qwy65gyq`)
- 已创建并配置完整

#### 平台账号 ✅
- 平台: FACEBOOK
- Page 名称: Chaterntest
- Page ID: `978782151990111`
- 状态: **已激活** (isActive = true)
- Access Token: 已加密存储 (长度 316)

#### 笔记本章节 ✅
- 6个激活的章节，包含完整内容：
  - 品牌信息 (114字)
  - 产品/服务 (203字)
  - 常见问答 (880字)
  - 语气与人设 (86字)
  - 转接规则 (270字)
  - 离题处理 (265字)

#### 回复设置 ✅
- 回复概率: 100%
- 无频率限制
- 无休息时间限制
- 上下文窗口: 20条消息

### 3. 根本原因 ❌

**NotebookConfig.isActive = false**

在 [`process-message.ts:92`](socialai/src/lib/process-message.ts:92) 中：

```typescript
if (!config?.isActive) return; // AI disabled — message saved, skip reply
```

当 `isActive = false` 时：
- Webhook 正常接收消息 ✅
- 消息保存到数据库 ✅
- **但跳过 AI 回复** ❌

### 4. 证据

数据库中有6条来自用户的消息（最近一条：2026-03-09 13:58:25），但**没有任何 AI 回复**。

```
👤 用户: 你好 (13:58:25)
👤 用户: 你好 (06:15:36)
👤 用户: ？ (06:10:35)
👤 用户: 你好 (06:09:45)
👤 用户: 你好 (06:08:06)
👤 用户: 你好 (06:07:42)
```

所有消息都被保存，但因为 AI 未激活，所以没有触发回复。

## 修复方案

### 已执行的修复

运行修复脚本：
```bash
npx tsx scripts/fix-notebook-config.ts
```

执行的 SQL：
```sql
UPDATE "NotebookConfig" 
SET "isActive" = true 
WHERE "brandId" = 'cmmis0j9k000104l1qwy65gyq';
```

### 修复结果 ✅

- NotebookConfig.isActive: `false` → `true`
- AI 笔记本已激活

## 测试步骤

现在可以测试修复效果：

1. **发送测试消息**
   - 打开 Facebook Page "Chaterntest"
   - 以普通用户身份发送消息："你好"

2. **预期结果**
   - 应该立即收到 AI 自动回复
   - 回复内容基于笔记本中的规则

3. **如果仍然没有回复**
   
   检查 Vercel 日志：
   ```bash
   vercel logs --follow
   ```
   
   查找以下关键信息：
   - `[Webhook POST] RECEIVED` - 确认收到 webhook
   - `[AI] Primary OPENAI` - AI 调用日志
   - 任何错误信息

## 其他可能的问题（如果修复后仍无法回复）

### 1. Access Token 过期
- 症状: 日志中出现 "Token 无效或已过期"
- 解决: 重新获取 Facebook Page Access Token

### 2. AI API Key 无效
- 症状: 日志中出现 "[AI] Primary OPENAI attempt failed"
- 解决: 检查 OPENAI_API_KEY 是否有效

### 3. Webhook 未订阅
- 症状: 日志中没有 `[Webhook POST] RECEIVED`
- 解决: 在 Meta App 中重新订阅 webhook

### 4. Vercel 环境变量
- 症状: 本地测试正常，但 Vercel 上不工作
- 解决: 检查 Vercel 项目的环境变量是否与本地 .env 一致

## 诊断工具

项目中创建了以下诊断脚本：

1. **`scripts/db-diagnose.ts`** - 完整数据库配置检查
2. **`scripts/fix-notebook-config.ts`** - 一键修复 NotebookConfig
3. **`scripts/analyze-config.ts`** - 代码逻辑分析
4. **`scripts/check-webhook-logs.md`** - Webhook 日志检查指南

## 总结

**问题已修复！** AI 笔记本配置已激活，现在应该可以正常回复消息了。

如果测试后仍有问题，请提供 Vercel 日志以便进一步诊断。