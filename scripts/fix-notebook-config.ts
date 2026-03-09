/**
 * 修复脚本 - 激活"小样奶茶店"的 AI 笔记本配置
 */

import { config } from "dotenv";
import { resolve } from "path";
import { Pool } from "pg";

config({ path: resolve(__dirname, "../.env") });

const DATABASE_URL = process.env.DATABASE_URL!;

async function main() {
  console.log("🔧 修复 AI 笔记本配置...\n");

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
    // 查找"小样奶茶店"品牌
    const brandResult = await pool.query(
      `SELECT id, name FROM "Brand" WHERE name = '小样奶茶店'`
    );

    if (brandResult.rows.length === 0) {
      console.log("❌ 未找到品牌'小样奶茶店'");
      return;
    }

    const brand = brandResult.rows[0];
    console.log(`✅ 找到品牌: ${brand.name} (ID: ${brand.id})\n`);

    // 检查当前配置
    const configResult = await pool.query(
      `SELECT * FROM "NotebookConfig" WHERE "brandId" = $1`,
      [brand.id]
    );

    if (configResult.rows.length === 0) {
      console.log("❌ 未找到 NotebookConfig");
      return;
    }

    const config = configResult.rows[0];
    console.log("当前配置:");
    console.log(`  isActive: ${config.isActive}`);
    console.log(`  aiProvider: ${config.aiProvider}`);
    console.log(`  fallbackProvider: ${config.fallbackProvider || "无"}\n`);

    if (config.isActive) {
      console.log("✅ AI 笔记本已经是激活状态，无需修改");
      return;
    }

    // 激活配置
    console.log("🔄 正在激活 AI 笔记本...");
    await pool.query(
      `UPDATE "NotebookConfig" SET "isActive" = true WHERE "brandId" = $1`,
      [brand.id]
    );

    console.log("✅ AI 笔记本已激活！\n");

    // 验证修改
    const verifyResult = await pool.query(
      `SELECT "isActive" FROM "NotebookConfig" WHERE "brandId" = $1`,
      [brand.id]
    );

    console.log("验证结果:");
    console.log(`  isActive: ${verifyResult.rows[0].isActive}\n`);

    console.log("=".repeat(60));
    console.log("✅ 修复完成！");
    console.log("=".repeat(60));
    console.log("\n现在可以测试：");
    console.log("1. 给 Facebook Page 'Chaterntest' 发送消息");
    console.log("2. 应该会收到 AI 自动回复");
    console.log("3. 如果还是没有回复，检查 Vercel 日志查看错误信息\n");

  } catch (err) {
    console.error("❌ 修复失败:", err);
  } finally {
    await pool.end();
  }
}

main();