/**
 * Diagnose Meta Token and Permissions
 * 
 * This script checks:
 * 1. If user has a Facebook account in database
 * 2. If the access token is valid
 * 3. What permissions the token has
 * 4. If the token can fetch pages
 */

import { prisma } from "../src/lib/db";

const GRAPH_API = "https://graph.facebook.com/v21.0";

async function diagnose() {
  console.log("=".repeat(60));
  console.log("Meta Token Diagnostics");
  console.log("=".repeat(60));

  // 1. Check database for Facebook accounts
  console.log("\n📊 Checking database...");
  const accounts = await prisma.account.findMany({
    where: { provider: "facebook" },
    include: { user: { select: { email: true, name: true } } },
  });

  if (accounts.length === 0) {
    console.log("❌ No Facebook accounts found in database");
    console.log("   Solution: Log in with Facebook to create an account");
    return;
  }

  console.log(`✅ Found ${accounts.length} Facebook account(s):`);
  for (const acc of accounts) {
    console.log(`   - User: ${acc.user.name} (${acc.user.email})`);
    console.log(`   - Provider Account ID: ${acc.providerAccountId}`);
    console.log(`   - Has Token: ${acc.access_token ? "Yes" : "No"}`);
  }

  // 2. Test each token
  for (const account of accounts) {
    console.log("\n" + "=".repeat(60));
    console.log(`Testing token for: ${account.user.name}`);
    console.log("=".repeat(60));

    if (!account.access_token) {
      console.log("❌ No access token found");
      continue;
    }

    const token = account.access_token;

    // Test 1: Check token validity
    console.log("\n🔍 Test 1: Token Validity");
    try {
      const debugRes = await fetch(
        `${GRAPH_API}/debug_token?input_token=${token}&access_token=${token}`
      );
      const debugData = await debugRes.json();

      if (debugData.data?.is_valid) {
        console.log("✅ Token is valid");
        console.log(`   App ID: ${debugData.data.app_id}`);
        console.log(`   User ID: ${debugData.data.user_id}`);
        console.log(`   Expires: ${debugData.data.expires_at ? new Date(debugData.data.expires_at * 1000).toISOString() : "Never"}`);
        console.log(`   Scopes: ${debugData.data.scopes?.join(", ") || "None"}`);
      } else {
        console.log("❌ Token is invalid");
        console.log(`   Error: ${JSON.stringify(debugData)}`);
        continue;
      }
    } catch (err) {
      console.log("❌ Failed to validate token:", err);
      continue;
    }

    // Test 2: Fetch user info
    console.log("\n🔍 Test 2: User Info");
    try {
      const meRes = await fetch(`${GRAPH_API}/me?fields=id,name&access_token=${token}`);
      const meData = await meRes.json();

      if (meData.id) {
        console.log("✅ Can fetch user info");
        console.log(`   ID: ${meData.id}`);
        console.log(`   Name: ${meData.name}`);
      } else {
        console.log("❌ Cannot fetch user info");
        console.log(`   Error: ${JSON.stringify(meData)}`);
      }
    } catch (err) {
      console.log("❌ Failed to fetch user info:", err);
    }

    // Test 3: Fetch pages
    console.log("\n🔍 Test 3: Fetch Pages");
    try {
      const pagesRes = await fetch(
        `${GRAPH_API}/me/accounts?fields=id,name,access_token,category,instagram_business_account&access_token=${token}`
      );
      const pagesData = await pagesRes.json();

      if (pagesData.data) {
        console.log(`✅ Can fetch pages: ${pagesData.data.length} page(s) found`);
        for (const page of pagesData.data) {
          console.log(`   - ${page.name} (ID: ${page.id})`);
          console.log(`     Category: ${page.category}`);
          console.log(`     Has IG: ${page.instagram_business_account ? "Yes" : "No"}`);
          if (page.instagram_business_account) {
            console.log(`     IG ID: ${page.instagram_business_account.id}`);
          }
        }
      } else {
        console.log("❌ Cannot fetch pages");
        console.log(`   Error: ${JSON.stringify(pagesData)}`);
        
        if (pagesData.error) {
          console.log("\n💡 Possible reasons:");
          if (pagesData.error.code === 190) {
            console.log("   - Token expired or invalid");
            console.log("   - Solution: Log out and log in again");
          } else if (pagesData.error.code === 200) {
            console.log("   - Missing 'pages_show_list' permission");
            console.log("   - Solution: Check auth.ts scope configuration");
          } else {
            console.log(`   - Error code: ${pagesData.error.code}`);
            console.log(`   - Message: ${pagesData.error.message}`);
          }
        }
      }
    } catch (err) {
      console.log("❌ Failed to fetch pages:", err);
    }

    // Test 4: Check permissions
    console.log("\n🔍 Test 4: Check Permissions");
    try {
      const permRes = await fetch(
        `${GRAPH_API}/me/permissions?access_token=${token}`
      );
      const permData = await permRes.json();

      if (permData.data) {
        console.log("✅ Token permissions:");
        const granted = permData.data.filter((p: { status: string }) => p.status === "granted");
        const declined = permData.data.filter((p: { status: string }) => p.status === "declined");

        console.log(`\n   Granted (${granted.length}):`);
        for (const perm of granted) {
          console.log(`   ✅ ${perm.permission}`);
        }

        if (declined.length > 0) {
          console.log(`\n   Declined (${declined.length}):`);
          for (const perm of declined) {
            console.log(`   ❌ ${perm.permission}`);
          }
        }

        // Check required permissions
        const requiredPerms = [
          "pages_show_list",
          "pages_messaging",
          "pages_manage_metadata",
          "pages_read_engagement",
          "instagram_basic",
          "instagram_manage_messages",
          "instagram_manage_comments",
        ];

        console.log("\n   Required permissions check:");
        for (const req of requiredPerms) {
          const has = granted.some((p: { permission: string }) => p.permission === req);
          console.log(`   ${has ? "✅" : "❌"} ${req}`);
        }
      }
    } catch (err) {
      console.log("❌ Failed to check permissions:", err);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("Diagnosis Complete");
  console.log("=".repeat(60));
}

diagnose()
  .catch(console.error)
  .finally(() => prisma.$disconnect());