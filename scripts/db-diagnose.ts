/**
 * 数据库诊断脚本 - 直接用 pg 连接，绕过 Prisma adapter 问题
 */

import { config } from "dotenv";
import { resolve } from "path";
import { Pool } from "pg";

config({ path: resolve(__dirname, "../.env") });

const DATABASE_URL = process.env.DATABASE_URL!;

async function main() {
  console.log("🔍 连接数据库进行诊断...\n");

  // 手动解析 DATABASE_URL，处理密码中的特殊字符
  const url = new URL(DATABASE_URL);
  const pool = new Pool({
    host: url.hostname,
    port: parseInt(url.port || "5432"),
    database: url.pathname.slice(1),
    user: url.username,
    password: decodeURIComponent(url.password),
    ssl: { rejectUnauthorized: false },
  });

  try {
    // 测试连接
    const testResult = await pool.query("SELECT 1 as ok");
    console.log("✅ 数据库连接成功\n");

    // 1. 检查品牌
    console.log("📋 品牌列表:");
    console.log("=".repeat(60));
    const brands = await pool.query('SELECT id, name, "createdAt" FROM "Brand"');
    for (const b of brands.rows) {
      console.log(`  品牌: ${b.name} (ID: ${b.id})`);
    }
    if (brands.rows.length === 0) {
      console.log("  ❌ 没有找到任何品牌！");
      return;
    }

    // 2. 检查 NotebookConfig
    console.log("\n📋 AI 笔记本配置:");
    console.log("=".repeat(60));
    const configs = await pool.query(`
      SELECT nc.*, b.name as brand_name 
      FROM "NotebookConfig" nc 
      JOIN "Brand" b ON b.id = nc."brandId"
    `);
    for (const c of configs.rows) {
      const status = c.isActive ? "✅ 已激活" : "❌ 未激活";
      console.log(`  品牌: ${c.brand_name}`);
      console.log(`  ${status}`);
      console.log(`  AI Provider: ${c.aiProvider}`);
      console.log(`  Fallback Provider: ${c.fallbackProvider || "无"}`);
      console.log(`  Fallback Message: ${c.fallbackMessage}`);
      console.log(`  Max Retries: ${c.maxRetries}, Timeout: ${c.timeoutMs}ms`);
      console.log();
    }
    if (configs.rows.length === 0) {
      console.log("  ❌ 没有找到 NotebookConfig！AI 回复不会触发。");
    }

    // 3. 检查 ReplySettings
    console.log("📋 回复设置:");
    console.log("=".repeat(60));
    const settings = await pool.query(`
      SELECT rs.*, b.name as brand_name 
      FROM "ReplySettings" rs 
      JOIN "Brand" b ON b.id = rs."brandId"
    `);
    for (const s of settings.rows) {
      const probStatus = s.replyProbability > 0 ? "✅" : "❌";
      console.log(`  品牌: ${s.brand_name}`);
      console.log(`  ${probStatus} 回复概率: ${s.replyProbability}%`);
      console.log(`  频率限制: ${s.dmFrequencyLimit || "无"}`);
      console.log(`  休息时间: ${s.restTimeStart || "无"} - ${s.restTimeEnd || "无"}`);
      console.log(`  上下文窗口: ${s.contextWindowSize}`);
      console.log(`  模拟打字: ${s.simulateTypingDelay}`);
      console.log();
    }
    if (settings.rows.length === 0) {
      console.log("  ⚠️ 没有找到 ReplySettings（将使用默认值，但 shouldReply 会返回 false！）");
      console.log("  ❌ 这是一个关键问题！没有 ReplySettings 意味着 shouldReply() 返回 false");
    }

    // 4. 检查平台账号
    console.log("📋 平台账号:");
    console.log("=".repeat(60));
    const accounts = await pool.query(`
      SELECT pa.*, b.name as brand_name 
      FROM "PlatformAccount" pa 
      JOIN "Brand" b ON b.id = pa."brandId"
    `);
    for (const a of accounts.rows) {
      const activeStatus = a.isActive ? "✅ 已激活" : "❌ 未激活";
      console.log(`  品牌: ${a.brand_name}`);
      console.log(`  平台: ${a.platform}`);
      console.log(`  名称: ${a.platformName}`);
      console.log(`  Page ID: ${a.platformUserId}`);
      console.log(`  ${activeStatus}`);
      console.log(`  Token 长度: ${a.accessToken?.length || 0}`);
      console.log(`  Token 过期: ${a.tokenExpiresAt || "未设置"}`);
      console.log(`  Scopes: ${a.scopes?.join(", ") || "无"}`);
      console.log();
    }
    if (accounts.rows.length === 0) {
      console.log("  ❌ 没有找到任何平台账号！");
    }

    // 5. 检查笔记本章节
    console.log("📋 笔记本章节:");
    console.log("=".repeat(60));
    const sections = await pool.query(`
      SELECT ns.*, b.name as brand_name 
      FROM "NotebookSection" ns 
      JOIN "Brand" b ON b.id = ns."brandId"
      ORDER BY ns."brandId", ns."sortOrder"
    `);
    for (const s of sections.rows) {
      const activeStatus = s.isActive ? "✅" : "❌";
      const hasContent = s.plainText && s.plainText.trim().length > 0;
      console.log(`  ${activeStatus} [${s.sectionType}] ${s.title} - 内容长度: ${s.plainText?.length || 0} ${hasContent ? "" : "⚠️ 无内容"}`);
    }
    if (sections.rows.length === 0) {
      console.log("  ❌ 没有找到任何笔记本章节！");
    }

    // 6. 检查最近的对话
    console.log("\n📋 最近的对话:");
    console.log("=".repeat(60));
    const conversations = await pool.query(`
      SELECT c.id, c.status, c."lastMessageAt", c."lastMessagePreview", 
             c."contactPlatformId", c."contactName",
             pa."platformName", pa.platform
      FROM "Conversation" c
      JOIN "PlatformAccount" pa ON pa.id = c."platformAccountId"
      ORDER BY c."lastMessageAt" DESC NULLS LAST
      LIMIT 10
    `);
    for (const c of conversations.rows) {
      console.log(`  对话 ${c.id.substring(0, 12)}...`);
      console.log(`    状态: ${c.status}`);
      console.log(`    平台: ${c.platform} (${c.platformName})`);
      console.log(`    联系人: ${c.contactName || c.contactPlatformId}`);
      console.log(`    最后消息: ${c.lastMessageAt}`);
      console.log(`    预览: ${c.lastMessagePreview?.substring(0, 50) || "无"}`);
      console.log();
    }
    if (conversations.rows.length === 0) {
      console.log("  ⚠️ 没有找到任何对话记录");
    }

    // 7. 检查最近的消息
    console.log("📋 最近的消息:");
    console.log("=".repeat(60));
    const messages = await pool.query(`
      SELECT m.id, m."senderType", m."messageType", m.content, m."createdAt",
             c."contactName", c."contactPlatformId"
      FROM "Message" m
      JOIN "Conversation" c ON c.id = m."conversationId"
      ORDER BY m."createdAt" DESC
      LIMIT 10
    `);
    for (const m of messages.rows) {
      const sender = m.senderType === "CONTACT" ? `👤 ${m.contactName || m.contactPlatformId}` 
                   : m.senderType === "AI" ? "🤖 AI" 
                   : "👨‍💼 Human";
      console.log(`  ${sender}: ${m.content?.substring(0, 80) || "无内容"}`);
      console.log(`    时间: ${m.createdAt}`);
      console.log();
    }
    if (messages.rows.length === 0) {
      console.log("  ⚠️ 没有找到任何消息记录");
    }

    // 8. 总结
    console.log("\n" + "=".repeat(60));
    console.log("📊 诊断总结:");
    console.log("=".repeat(60) + "\n");

    const issues: string[] = [];

    // 检查 NotebookConfig 是否激活
    const activeConfigs = configs.rows.filter((c: any) => c.isActive);
    if (activeConfigs.length === 0) {
      issues.push("❌ AI 笔记本未激活 (NotebookConfig.isActive = false)");
    }

    // 检查 ReplySettings
    if (settings.rows.length === 0) {
      issues.push("❌ 没有回复设置 (ReplySettings 不存在) - shouldReply() 会返回 false！");
    } else {
      const zeroProb = settings.rows.filter((s: any) => s.replyProbability === 0);
      if (zeroProb.length > 0) {
        issues.push("❌ 回复概率为 0 (replyProbability = 0)");
      }
    }

    // 检查平台账号
    const inactiveAccounts = accounts.rows.filter((a: any) => !a.isActive);
    if (inactiveAccounts.length > 0) {
      issues.push(`❌ ${inactiveAccounts.length} 个平台账号未激活`);
    }

    // 检查笔记本章节
    const activeSections = sections.rows.filter((s: any) => s.isActive && s.plainText?.trim());
    if (activeSections.length === 0) {
      issues.push("❌ 没有激活的笔记本章节（或章节内容为空）");
    }

    if (issues.length === 0) {
      console.log("✅ 数据库配置看起来正常！\n");
      console.log("如果仍然无法回复，问题可能在于：");
      console.log("1. Meta Webhook 没有正确订阅");
      console.log("2. Access Token 过期");
      console.log("3. AI API Key 无效");
      console.log("4. Vercel 部署的环境变量与本地不同");
    } else {
      console.log("发现以下问题：\n");
      for (const issue of issues) {
        console.log(`  ${issue}`);
      }
    }

    console.log();

  } catch (err) {
    console.error("❌ 数据库查询失败:", err);
  } finally {
    await pool.end();
  }
}

main();