# 诊断 Facebook 消息回复问题 - 使用 Vercel 日志

## 问题描述
Facebook Page 收到消息后，AI 没有自动回复。

## 诊断步骤

### 1. 检查 Vercel Webhook 日志

在 Vercel 控制台中查看实时日志：

```bash
# 方法1: 使用 Vercel CLI
vercel logs --follow

# 方法2: 在 Vercel Dashboard 查看
# https://vercel.com/your-project/logs
```

### 2. 发送测试消息

1. 打开 Facebook Page "Chaterntest"
2. 以普通用户身份发送消息："你好"
3. 观察 Vercel 日志输出

### 3. 关键日志检查点

查找以下日志关键字：

#### ✅ Webhook 接收成功
```
[Webhook POST] RECEIVED — object: page
```

#### ✅ 找到平台账号
```
找到账号配置
```

#### ❌ 可能的错误

**错误1: Webhook 未收到请求**
- 检查 Meta App 的 Webhook 订阅
- 确认 Webhook URL 正确: `https://your-domain.vercel.app/api/webhook/meta`

**错误2: 平台账号未找到或未激活**
```
account not found 或 isActive = false
```
解决: 在数据库中检查 PlatformAccount 表

**错误3: AI 配置未激活**
```
AI disabled — message saved, skip reply
```
解决: 在数据库中设置 NotebookConfig.isActive = true

**错误4: Token 无效**
```
Token 无效或已过期
```
解决: 重新获取 Facebook Page Access Token

**错误5: AI 调用失败**
```
[AI] Primary GOOGLE attempt 1 failed
```
解决: 检查 GOOGLE_AI_API_KEY 是否有效

### 4. 数据库直接检查

如果你能提供 Vercel Postgres 连接信息，我可以帮你直接查询数据库：

```sql
-- 检查品牌配置
SELECT 
  b.id, b.name,
  nc.isActive as ai_active,
  nc.aiProvider,
  rs.replyProbability
FROM "Brand" b
LEFT JOIN "NotebookConfig" nc ON nc."brandId" = b.id
LEFT JOIN "ReplySettings" rs ON rs."brandId" = b.id;

-- 检查平台账号
SELECT 
  pa.id,
  pa.platform,
  pa."platformName",
  pa."platformUserId",
  pa."isActive",
  b.name as brand_name
FROM "PlatformAccount" pa
JOIN "Brand" b ON b.id = pa."brandId"
WHERE pa.platform = 'FACEBOOK';

-- 检查最近的对话
SELECT 
  c.id,
  c."lastMessageAt",
  c.status,
  COUNT(m.id) as message_count,
  SUM(CASE WHEN m."senderType" = 'AI' THEN 1 ELSE 0 END) as ai_replies
FROM "Conversation" c
LEFT JOIN "Message" m ON m."conversationId" = c.id
GROUP BY c.id
ORDER BY c."lastMessageAt" DESC
LIMIT 5;
```

### 5. 常见问题清单

- [ ] Meta App Webhook 已订阅 `messages` 和 `messaging_postbacks`
- [ ] Webhook Verify Token 匹配 (META_WEBHOOK_VERIFY_TOKEN)
- [ ] PlatformAccount.isActive = true
- [ ] NotebookConfig.isActive = true
- [ ] NotebookConfig 有至少一个激活的 section
- [ ] ReplySettings.replyProbability > 0
- [ ] Access Token 有效且有正确的权限
- [ ] GOOGLE_AI_API_KEY 或 OPENAI_API_KEY 有效

### 6. 快速修复命令

如果确认是配置问题，可以在 Vercel Postgres 中执行：

```sql
-- 激活 AI 笔记本
UPDATE "NotebookConfig" 
SET "isActive" = true 
WHERE "brandId" = 'your-brand-id';

-- 激活平台账号
UPDATE "PlatformAccount" 
SET "isActive" = true 
WHERE "platformUserId" = '1062086906977948';

-- 设置回复概率为 100%
UPDATE "ReplySettings" 
SET "replyProbability" = 100 
WHERE "brandId" = 'your-brand-id';
```

## 下一步

请提供以下信息以便进一步诊断：

1. **Vercel 日志截图** - 发送测试消息后的完整日志
2. **Vercel Connect URL** - 如果你想让我直接连接到 Vercel 查看日志
3. **数据库查询结果** - 上述 SQL 查询的结果

或者，你可以：
- 在 Vercel Dashboard 中查看实时日志
- 使用 `vercel logs` 命令查看日志
- 提供 Vercel 项目的访问权限