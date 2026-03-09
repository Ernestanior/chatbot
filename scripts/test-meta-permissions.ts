/**
 * Meta API Permissions Test Script
 *
 * Run this script to make test API calls for Meta App Review.
 * This will help complete the "0 API test calls" requirements.
 *
 * Usage:
 *   1. Set environment variables (or edit the values below)
 *   2. Run: npx tsx scripts/test-meta-permissions.ts
 *
 * Required env vars:
 *   - META_ACCESS_TOKEN: Page/User access token with required permissions
 *   - META_PAGE_ID: Your Facebook Page ID
 *   - META_IG_USER_ID: (Optional) Your Instagram Business Account ID - will auto-fetch if not provided
 */

const GRAPH_API = "https://graph.facebook.com/v21.0";

// ===== CONFIGURATION =====
// You can hardcode these for testing, or use env vars
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || "EAF3wde8vvfsBQwTjogyHsC1NTzK0nLdPqcubBi2CIaX9UrPQtNYlSVBWGR49CqRgGIChh38X9fpkLZAOB49irBhSPZCKKqZBDsBqJMXzYRRzrfFbqgLts2swnp69QTrE1o4W0Is971y9Ezja8WDmuNR57KHTZBcnadbajojiuZCZA8RrokfSzhFmZCdU1H7ikZA7ABd4JzWzjDntbG2jCKGnlkT7WCFnNO31NRhH1ZCZACvcPCE1osm2OLemX9qcRIVM6bKcKKN0ni9fr52wpHJtUYmXapTQZDZD";
const PAGE_ID = process.env.META_PAGE_ID || "1062086906977948";
let IG_USER_ID = process.env.META_IG_USER_ID || "";

interface TestResult {
  permission: string;
  endpoint: string;
  success: boolean;
  response?: unknown;
  error?: string;
}

const results: TestResult[] = [];

async function testEndpoint(
  permission: string,
  endpoint: string,
  method: "GET" | "POST" = "GET",
  body?: Record<string, unknown>
): Promise<void> {
  console.log(`\n📡 Testing: ${permission}`);
  console.log(`   Endpoint: ${endpoint}`);

  try {
    const url = `${GRAPH_API}${endpoint}${endpoint.includes("?") ? "&" : "?"}access_token=${ACCESS_TOKEN}`;
    
    const options: RequestInit = {
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(url, options);
    const data = await res.json();

    if (res.ok) {
      console.log(`   ✅ SUCCESS`);
      console.log(`   Response:`, JSON.stringify(data).substring(0, 200));
      results.push({ permission, endpoint, success: true, response: data });
    } else {
      const errMsg = (data as { error?: { message?: string } }).error?.message || JSON.stringify(data);
      console.log(`   ❌ FAILED: ${errMsg}`);
      results.push({ permission, endpoint, success: false, error: errMsg });
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.log(`   ❌ ERROR: ${errMsg}`);
    results.push({ permission, endpoint, success: false, error: errMsg });
  }
}

async function fetchIGUserId(): Promise<string> {
  console.log("\n🔍 Fetching Instagram User ID from Page...");
  try {
    const url = `${GRAPH_API}/${PAGE_ID}?fields=instagram_business_account&access_token=${ACCESS_TOKEN}`;
    const res = await fetch(url);
    const data = await res.json() as { instagram_business_account?: { id: string }; error?: { message: string } };
    
    if (data.instagram_business_account?.id) {
      console.log(`   ✅ Found IG User ID: ${data.instagram_business_account.id}`);
      return data.instagram_business_account.id;
    } else {
      console.log(`   ⚠️ No Instagram Business Account linked to this Page`);
      console.log(`   Response:`, JSON.stringify(data).substring(0, 200));
      return "";
    }
  } catch (err) {
    console.log(`   ❌ Error fetching IG User ID:`, err);
    return "";
  }
}

async function runTests() {
  console.log("=".repeat(60));
  console.log("Meta API Permissions Test Script");
  console.log("=".repeat(60));
  console.log(`\nUsing Page ID: ${PAGE_ID}`);
  console.log(`Token: ${ACCESS_TOKEN.substring(0, 20)}...`);

  // Auto-fetch IG User ID if not provided
  if (!IG_USER_ID) {
    IG_USER_ID = await fetchIGUserId();
  }
  console.log(`Using IG User ID: ${IG_USER_ID || "(not available)"}`);

  // ===== Test public_profile =====
  await testEndpoint(
    "public_profile",
    "/me?fields=id,name"
  );

  // ===== Test instagram_business_basic =====
  if (IG_USER_ID) {
    await testEndpoint(
      "instagram_business_basic",
      `/${IG_USER_ID}?fields=id,username,name,profile_picture_url,followers_count,media_count`
    );
  } else {
    console.log("\n⚠️ Skipping instagram_business_basic - No IG User ID");
    results.push({ permission: "instagram_business_basic", endpoint: "N/A", success: false, error: "No IG User ID" });
  }

  // ===== Test instagram_basic =====
  if (IG_USER_ID) {
    await testEndpoint(
      "instagram_basic",
      `/${IG_USER_ID}?fields=id,username`
    );
  } else {
    console.log("\n⚠️ Skipping instagram_basic - No IG User ID");
    results.push({ permission: "instagram_basic", endpoint: "N/A", success: false, error: "No IG User ID" });
  }

  // ===== Test business_management =====
  await testEndpoint(
    "business_management",
    "/me/businesses?fields=id,name"
  );

  // ===== Test pages_show_list =====
  await testEndpoint(
    "pages_show_list",
    "/me/accounts?fields=id,name,access_token"
  );

  // ===== Test pages_read_engagement =====
  await testEndpoint(
    "pages_read_engagement",
    `/${PAGE_ID}?fields=id,name,fan_count,followers_count`
  );

  // ===== Test pages_manage_metadata =====
  await testEndpoint(
    "pages_manage_metadata",
    `/${PAGE_ID}?fields=id,name,about,category`
  );

  // ===== Test instagram_manage_messages (get conversations) =====
  if (IG_USER_ID) {
    await testEndpoint(
      "instagram_manage_messages",
      `/${IG_USER_ID}/conversations?fields=id,participants`
    );
  } else {
    console.log("\n⚠️ Skipping instagram_manage_messages - No IG User ID");
    results.push({ permission: "instagram_manage_messages", endpoint: "N/A", success: false, error: "No IG User ID" });
  }

  // ===== Test instagram_business_manage_messages =====
  if (IG_USER_ID) {
    await testEndpoint(
      "instagram_business_manage_messages",
      `/${IG_USER_ID}/conversations?fields=id,participants,messages{id,message,from}`
    );
  } else {
    console.log("\n⚠️ Skipping instagram_business_manage_messages - No IG User ID");
    results.push({ permission: "instagram_business_manage_messages", endpoint: "N/A", success: false, error: "No IG User ID" });
  }

  // ===== Test pages_messaging (get page conversations) =====
  await testEndpoint(
    "pages_messaging",
    `/${PAGE_ID}/conversations?fields=id,participants`
  );

  // ===== Test instagram_manage_comments =====
  // First get media, then get comments
  if (IG_USER_ID) {
    console.log(`\n📡 Testing: instagram_manage_comments`);
    console.log(`   Step 1: Get recent media...`);
    
    try {
      const mediaRes = await fetch(
        `${GRAPH_API}/${IG_USER_ID}/media?fields=id,caption&limit=1&access_token=${ACCESS_TOKEN}`
      );
      const mediaData = await mediaRes.json() as { data?: Array<{ id: string }> };
      
      if (mediaData.data && mediaData.data.length > 0) {
        const mediaId = mediaData.data[0].id;
        await testEndpoint(
          "instagram_manage_comments",
          `/${mediaId}/comments?fields=id,text,username`
        );
      } else {
        console.log(`   ⚠️ No media found to test comments`);
        results.push({
          permission: "instagram_manage_comments",
          endpoint: "/{media-id}/comments",
          success: false,
          error: "No media found on account",
        });
      }
    } catch (err) {
      console.log(`   ❌ ERROR getting media:`, err);
    }
  } else {
    console.log("\n⚠️ Skipping instagram_manage_comments - No IG User ID");
    results.push({ permission: "instagram_manage_comments", endpoint: "N/A", success: false, error: "No IG User ID" });
  }

  // ===== SUMMARY =====
  console.log("\n" + "=".repeat(60));
  console.log("TEST SUMMARY");
  console.log("=".repeat(60));

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${results.length}`);

  console.log("\n--- Detailed Results ---");
  for (const r of results) {
    const icon = r.success ? "✅" : "❌";
    console.log(`${icon} ${r.permission}: ${r.success ? "OK" : r.error}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("NEXT STEPS");
  console.log("=".repeat(60));
  console.log(`
1. If tests passed, check Meta App Dashboard - the API call counts should increase.
2. For failed tests, check:
   - Is the access token valid and has the required permissions?
   - Are the Page ID and IG User ID correct?
   - Has the Instagram account been connected to the Facebook Page?

3. To test MESSAGE SENDING (instagram_business_manage_messages):
   - You need a real recipient who has messaged your IG account first
   - Or use the test-send-message.ts script with a valid conversation

4. After successful API calls, go to Meta App Dashboard > App Review
   and the "0 API test calls" should now show actual counts.
`);
}

// Run the tests
runTests().catch(console.error);