/**
 * 配置分析脚本 - 不需要数据库连接
 * 分析代码逻辑找出可能导致回复失败的原因
 */

import { config } from "dotenv";
import { resolve } from "path";

// 加载 .env 文件
config({ path: resolve(__dirname, "../.env") });

console.log("🔍 分析 Facebook 消息回复配置...\n");

// 检查环境变量
console.log("📋 环境变量检查:");
console.log("=".repeat(60));

const requiredVars = {
  "DATABASE_URL": process.env.DATABASE_URL,
  "META_WEBHOOK_VERIFY_TOKEN": process.env.META_WEBHOOK_VERIFY_TOKEN,
  "META_APP_ID": process.env.META_APP_ID,
  "META_APP_SECRET": process.env.META_APP_SECRET,
  "GOOGLE_AI_API_KEY": process.env.GOOGLE_AI_API_KEY,
  "OPENAI_API_KEY": process.env.OPENAI_API_KEY,
  "ENCRYPTION_KEY": process.env.ENCRYPTION_KEY,
  "UPSTASH_REDIS_REST_URL": process.env.UPSTASH_REDIS_REST_URL,
  "UPSTASH_REDIS_REST_TOKEN": process.env.UPSTASH_REDIS_REST_TOKEN,
};

let hasError = false;

for (const [key, value] of Object.entries(requiredVars)) {
  if (!value) {
    console.log(`❌ ${key}: 未设置`);
    hasError = true;
  } else {
    const display = key.includes("KEY") || key.includes("TOKEN") || key.includes("SECRET")
      ? `${value.substring(0, 10)}...` 
      : value.length > 50 
      ? `${value.substring(0, 50)}...`
      : value;
    console.log(`✅ ${key}: ${display}`);
  }
}

console.log("\n" + "=".repeat(60));
console.log("📊 代码逻辑分析:");
console.log("=".repeat(60) + "\n");

console.log("根据代码分析，消息回复失败的可能原因：\n");

console.log("1️⃣ Webhook 接收阶段 (route.ts):");
console.log("   - Webhook 必须收到 POST 请求");
console.log("   - body.object 必须是 'page' (Facebook) 或 'instagram'");
console.log("   - entry.messaging 必须包含消息事件");
console.log("   - message.is_echo 必须为 false (不是回声消息)\n");

console.log("2️⃣ 平台账号查找 (route.ts:85-88):");
console.log("   - 数据库中必须存在 PlatformAccount 记录");
console.log("   - platform = 'FACEBOOK'");
console.log("   - platformUserId = Page ID (从 webhook 的 entry.id)");
console.log("   - isActive = true ⚠️ 关键检查点\n");

console.log("3️⃣ AI 配置检查 (process-message.ts:92):");
console.log("   - NotebookConfig 必须存在");
console.log("   - NotebookConfig.isActive = true ⚠️ 关键检查点");
console.log("   - 如果为 false，消息会保存但不会回复\n");

console.log("4️⃣ 对话状态检查 (process-message.ts:93):");
console.log("   - conversation.status 不能是 'HUMAN_TAKEOVER'");
console.log("   - conversation.status 不能是 'CLOSED'\n");

console.log("5️⃣ 回复设置检查 (process-message.ts:94):");
console.log("   - ReplySettings.replyProbability 必须 > 0");
console.log("   - 如果为 0，表示自动回复已禁用 ⚠️ 关键检查点\n");

console.log("6️⃣ 频率限制检查 (process-message.ts:97):");
console.log("   - 如果设置了 dmFrequencyLimit");
console.log("   - Redis 中的计数不能超过限制\n");

console.log("7️⃣ 休息时间检查 (process-message.ts:100):");
console.log("   - 如果设置了 restTimeStart 和 restTimeEnd");
console.log("   - 当前时间不能在休息时间内\n");

console.log("8️⃣ AI 调用 (process-message.ts:139-159):");
console.log("   - 主 AI Provider 必须配置正确");
console.log("   - API Key 必须有效");
console.log("   - 如果主 Provider 失败，会尝试备用 Provider");
console.log("   - 如果都失败，会返回 fallbackMessage\n");

console.log("9️⃣ 消息发送 (process-message.ts:188-197):");
console.log("   - 调用 Meta Graph API 发送消息");
console.log("   - 需要有效的 Page Access Token");
console.log("   - Token 必须有 pages_messaging 权限\n");

console.log("=".repeat(60));
console.log("🎯 最可能的问题:");
console.log("=".repeat(60) + "\n");

console.log("基于代码分析，最常见的问题是：\n");

console.log("❌ 问题1: NotebookConfig.isActive = false");
console.log("   → AI 笔记本未激活，消息会保存但不会触发回复");
console.log("   → 解决: 在数据库中设置 isActive = true\n");

console.log("❌ 问题2: PlatformAccount.isActive = false");
console.log("   → 平台账号未激活，webhook 会忽略该账号的消息");
console.log("   → 解决: 在数据库中设置 isActive = true\n");

console.log("❌ 问题3: ReplySettings.replyProbability = 0");
console.log("   → 自动回复已禁用");
console.log("   → 解决: 设置为 100 (100% 回复概率)\n");

console.log("❌ 问题4: NotebookSections 全部未激活");
console.log("   → 没有激活的规则章节，AI 无法生成回复");
console.log("   → 解决: 至少激活一个 section\n");

console.log("❌ 问题5: Access Token 过期或无效");
console.log("   → Meta API 调用失败");
console.log("   → 解决: 重新获取 Page Access Token\n");

console.log("=".repeat(60));
console.log("📝 建议的诊断步骤:");
console.log("=".repeat(60) + "\n");

console.log("1. 查看 Vercel 实时日志:");
console.log("   vercel logs --follow\n");

console.log("2. 发送测试消息到 Facebook Page\n");

console.log("3. 在日志中查找:");
console.log("   - '[Webhook POST] RECEIVED' - 确认收到 webhook");
console.log("   - 'account not found' - 平台账号问题");
console.log("   - 'AI disabled' - NotebookConfig 未激活");
console.log("   - 'skip reply' - 回复被跳过的原因");
console.log("   - '[AI] Primary' - AI 调用日志");
console.log("   - 'Send failed' - 消息发送失败\n");

console.log("4. 如果需要，我可以帮你:");
console.log("   - 连接到 Vercel 查看实时日志");
console.log("   - 直接查询数据库检查配置");
console.log("   - 测试 Meta API Token 权限\n");

if (hasError) {
  console.log("⚠️ 警告: 发现缺失的环境变量，这可能导致功能异常\n");
}

console.log("=".repeat(60));
console.log("💡 快速修复 SQL (如果确认是配置问题):");
console.log("=".repeat(60) + "\n");

console.log(`-- 1. 查找你的品牌 ID
SELECT id, name FROM "Brand";

-- 2. 激活 AI 笔记本
UPDATE "NotebookConfig" 
SET "isActive" = true 
WHERE "brandId" = 'YOUR_BRAND_ID';

-- 3. 激活平台账号
UPDATE "PlatformAccount" 
SET "isActive" = true 
WHERE "platformUserId" = '1062086906977948';

-- 4. 设置回复概率
UPDATE "ReplySettings" 
SET "replyProbability" = 100 
WHERE "brandId" = 'YOUR_BRAND_ID';

-- 5. 检查笔记本章节
SELECT "sectionType", "isActive", LENGTH("plainText") as content_length
FROM "NotebookSection"
WHERE "brandId" = 'YOUR_BRAND_ID';
`);

console.log("\n✅ 分析完成！\n");