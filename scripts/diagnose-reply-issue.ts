/**
 * 诊断脚本 - 检查为什么Facebook消息无法收到AI回复
 * 
 * 运行方式: npx tsx scripts/diagnose-reply-issue.ts
 */

import { prisma } from "../src/lib/db";
import { decrypt } from "../src/lib/encryption";

interface DiagnosticResult {
  category: string;
  status: "✅ 正常" | "⚠️ 警告" | "❌ 错误";
  message: string;
  details?: any;
}

const results: DiagnosticResult[] = [];

async function diagnose() {
  console.log("🔍 开始诊断 Facebook 消息回复问题...\n");

  // 1. 检查品牌配置
  console.log("📋 检查品牌配置...");
  const brands = await prisma.brand.findMany({
    include: {
      notebookConfig: true,
      replySettings: true,
      notebookSections: true,
      platformAccounts: true,
    },
  });

  if (brands.length === 0) {
    results.push({
      category: "品牌配置",
      status: "❌ 错误",
      message: "没有找到任何品牌",
    });
  } else {
    for (const brand of brands) {
      console.log(`\n  品牌: ${brand.name} (ID: ${brand.id})`);
      
      // 检查 NotebookConfig
      if (!brand.notebookConfig) {
        results.push({
          category: `品牌: ${brand.name}`,
          status: "❌ 错误",
          message: "AI笔记本配置不存在",
          details: { brandId: brand.id },
        });
      } else if (!brand.notebookConfig.isActive) {
        results.push({
          category: `品牌: ${brand.name}`,
          status: "❌ 错误",
          message: "AI笔记本未激活 (isActive = false)",
          details: { 
            brandId: brand.id,
            aiProvider: brand.notebookConfig.aiProvider,
            fallbackProvider: brand.notebookConfig.fallbackProvider,
          },
        });
      } else {
        results.push({
          category: `品牌: ${brand.name}`,
          status: "✅ 正常",
          message: "AI笔记本已激活",
          details: {
            aiProvider: brand.notebookConfig.aiProvider,
            fallbackProvider: brand.notebookConfig.fallbackProvider,
            maxRetries: brand.notebookConfig.maxRetries,
            timeoutMs: brand.notebookConfig.timeoutMs,
          },
        });
      }

      // 检查 NotebookSections
      const activeSections = brand.notebookSections.filter(s => s.isActive);
      if (activeSections.length === 0) {
        results.push({
          category: `品牌: ${brand.name}`,
          status: "⚠️ 警告",
          message: "没有激活的AI笔记本章节",
          details: { totalSections: brand.notebookSections.length },
        });
      } else {
        results.push({
          category: `品牌: ${brand.name}`,
          status: "✅ 正常",
          message: `有 ${activeSections.length} 个激活的笔记本章节`,
          details: activeSections.map(s => ({
            type: s.sectionType,
            title: s.title,
            hasContent: s.plainText.length > 0,
          })),
        });
      }

      // 检查 ReplySettings
      if (!brand.replySettings) {
        results.push({
          category: `品牌: ${brand.name}`,
          status: "⚠️ 警告",
          message: "回复设置不存在（将使用默认值）",
        });
      } else {
        const settings = brand.replySettings;
        if (settings.replyProbability === 0) {
          results.push({
            category: `品牌: ${brand.name}`,
            status: "❌ 错误",
            message: "自动回复已禁用 (replyProbability = 0)",
            details: settings,
          });
        } else {
          results.push({
            category: `品牌: ${brand.name}`,
            status: "✅ 正常",
            message: `回复概率: ${settings.replyProbability}%`,
            details: {
              contextWindowSize: settings.contextWindowSize,
              simulateTypingDelay: settings.simulateTypingDelay,
              restTime: settings.restTimeStart && settings.restTimeEnd 
                ? `${settings.restTimeStart} - ${settings.restTimeEnd}` 
                : "无",
            },
          });
        }
      }

      // 检查 PlatformAccounts
      console.log(`\n  平台账号 (${brand.platformAccounts.length}):`);
      for (const account of brand.platformAccounts) {
        console.log(`    - ${account.platform}: ${account.platformName} (ID: ${account.platformUserId})`);
        
        if (!account.isActive) {
          results.push({
            category: `平台账号: ${account.platformName}`,
            status: "❌ 错误",
            message: "账号未激活 (isActive = false)",
            details: {
              platform: account.platform,
              platformUserId: account.platformUserId,
            },
          });
        } else {
          // 检查 token
          try {
            const token = decrypt(account.accessToken);
            if (!token || token.length < 10) {
              results.push({
                category: `平台账号: ${account.platformName}`,
                status: "❌ 错误",
                message: "Access Token 无效或为空",
                details: { platform: account.platform },
              });
            } else {
              results.push({
                category: `平台账号: ${account.platformName}`,
                status: "✅ 正常",
                message: "账号已激活，Token 已加密存储",
                details: {
                  platform: account.platform,
                  platformUserId: account.platformUserId,
                  tokenLength: token.length,
                  tokenExpiresAt: account.tokenExpiresAt,
                  scopes: account.scopes,
                },
              });
            }
          } catch (err) {
            results.push({
              category: `平台账号: ${account.platformName}`,
              status: "❌ 错误",
              message: "Token 解密失败",
              details: { error: err instanceof Error ? err.message : String(err) },
            });
          }
        }
      }
    }
  }

  // 2. 检查环境变量
  console.log("\n🔧 检查环境变量...");
  const requiredEnvVars = [
    "DATABASE_URL",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "META_WEBHOOK_VERIFY_TOKEN",
    "ENCRYPTION_KEY",
    "GOOGLE_AI_API_KEY",
    "OPENAI_API_KEY",
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      results.push({
        category: "环境变量",
        status: "❌ 错误",
        message: `${envVar} 未设置`,
      });
    } else {
      results.push({
        category: "环境变量",
        status: "✅ 正常",
        message: `${envVar} 已设置`,
      });
    }
  }

  // 3. 检查最近的对话
  console.log("\n💬 检查最近的对话...");
  const recentConversations = await prisma.conversation.findMany({
    take: 5,
    orderBy: { lastMessageAt: "desc" },
    include: {
      messages: {
        take: 3,
        orderBy: { createdAt: "desc" },
      },
      platformAccount: true,
    },
  });

  if (recentConversations.length === 0) {
    results.push({
      category: "对话历史",
      status: "⚠️ 警告",
      message: "没有找到任何对话记录",
    });
  } else {
    for (const conv of recentConversations) {
      const aiMessages = conv.messages.filter(m => m.senderType === "AI");
      const contactMessages = conv.messages.filter(m => m.senderType === "CONTACT");
      
      results.push({
        category: "对话历史",
        status: aiMessages.length > 0 ? "✅ 正常" : "⚠️ 警告",
        message: `对话 ${conv.id.substring(0, 8)}... - ${conv.platformAccount.platformName}`,
        details: {
          lastMessageAt: conv.lastMessageAt,
          status: conv.status,
          totalMessages: conv.messages.length,
          aiReplies: aiMessages.length,
          contactMessages: contactMessages.length,
          lastPreview: conv.lastMessagePreview?.substring(0, 50),
        },
      });
    }
  }

  // 4. 输出诊断报告
  console.log("\n" + "=".repeat(80));
  console.log("📊 诊断报告");
  console.log("=".repeat(80) + "\n");

  const errors = results.filter(r => r.status === "❌ 错误");
  const warnings = results.filter(r => r.status === "⚠️ 警告");
  const success = results.filter(r => r.status === "✅ 正常");

  console.log(`✅ 正常: ${success.length}`);
  console.log(`⚠️ 警告: ${warnings.length}`);
  console.log(`❌ 错误: ${errors.length}\n`);

  if (errors.length > 0) {
    console.log("🔴 关键错误:");
    for (const result of errors) {
      console.log(`\n  [${result.category}]`);
      console.log(`  ${result.status} ${result.message}`);
      if (result.details) {
        console.log(`  详情: ${JSON.stringify(result.details, null, 2)}`);
      }
    }
  }

  if (warnings.length > 0) {
    console.log("\n🟡 警告:");
    for (const result of warnings) {
      console.log(`\n  [${result.category}]`);
      console.log(`  ${result.status} ${result.message}`);
      if (result.details) {
        console.log(`  详情: ${JSON.stringify(result.details, null, 2)}`);
      }
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("💡 建议:");
  console.log("=".repeat(80) + "\n");

  if (errors.length > 0) {
    console.log("1. 请先修复上述关键错误");
    console.log("2. 确保 AI 笔记本已激活 (NotebookConfig.isActive = true)");
    console.log("3. 确保平台账号已激活 (PlatformAccount.isActive = true)");
    console.log("4. 确保回复概率不为 0 (ReplySettings.replyProbability > 0)");
    console.log("5. 检查 Meta Access Token 是否有效");
  } else if (warnings.length > 0) {
    console.log("配置基本正常，但有一些警告需要注意");
  } else {
    console.log("✅ 所有配置看起来都正常！");
    console.log("\n如果仍然无法收到回复，请检查:");
    console.log("1. Vercel webhook 日志");
    console.log("2. Meta App 的 webhook 订阅是否正确");
    console.log("3. 发送测试消息到 Facebook Page");
  }

  console.log("\n");
}

diagnose()
  .catch((err) => {
    console.error("❌ 诊断过程出错:", err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });