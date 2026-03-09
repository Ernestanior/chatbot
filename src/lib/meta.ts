/**
 * Meta Graph API utilities
 * Handles token exchange, page listing, and IG account discovery
 */

const GRAPH_API = "https://graph.facebook.com/v21.0";

interface MetaPage {
  id: string;
  name: string;
  access_token: string;
  category: string;
  instagram_business_account?: { id: string };
}

interface MetaIGAccount {
  id: string;
  name: string;
  username: string;
  profile_picture_url?: string;
}

export interface ConnectableAccount {
  platform: "FACEBOOK" | "INSTAGRAM";
  platformUserId: string;
  platformName: string;
  accessToken: string;
  pageId?: string; // FB page id for IG accounts
}

/**
 * Exchange short-lived user token for a long-lived one (~60 days)
 */
export async function exchangeLongLivedToken(shortToken: string): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
}> {
  const res = await fetch(
    `${GRAPH_API}/oauth/access_token?` +
      new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: process.env.META_APP_ID!,
        client_secret: process.env.META_APP_SECRET!,
        fb_exchange_token: shortToken,
      })
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Token exchange failed: ${JSON.stringify(err)}`);
  }
  return res.json();
}

/**
 * Get all Facebook Pages the user manages
 */
export async function getUserPages(userToken: string): Promise<MetaPage[]> {
  const res = await fetch(
    `${GRAPH_API}/me/accounts?fields=id,name,access_token,category,instagram_business_account&limit=100`,
    { headers: { Authorization: `Bearer ${userToken}` } }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Failed to fetch pages: ${JSON.stringify(err)}`);
  }
  const data = await res.json();
  return data.data ?? [];
}

/**
 * Get Instagram Business Account details from a page's IG connection
 */
export async function getIGAccountDetails(
  igAccountId: string,
  pageToken: string
): Promise<MetaIGAccount | null> {
  const res = await fetch(
    `${GRAPH_API}/${igAccountId}?fields=id,name,username,profile_picture_url`,
    { headers: { Authorization: `Bearer ${pageToken}` } }
  );
  if (!res.ok) return null;
  return res.json();
}

/**
 * Discover all connectable accounts (FB pages + IG business accounts)
 */
export async function discoverAccounts(userToken: string): Promise<ConnectableAccount[]> {
  const pages = await getUserPages(userToken);
  const accounts: ConnectableAccount[] = [];

  for (const page of pages) {
    // Each FB page is connectable
    accounts.push({
      platform: "FACEBOOK",
      platformUserId: page.id,
      platformName: page.name,
      accessToken: page.access_token,
    });

    // If page has linked IG business account
    if (page.instagram_business_account?.id) {
      const ig = await getIGAccountDetails(
        page.instagram_business_account.id,
        page.access_token
      );
      if (ig) {
        accounts.push({
          platform: "INSTAGRAM",
          platformUserId: ig.id,
          platformName: ig.username || ig.name,
          accessToken: page.access_token, // IG uses page token
          pageId: page.id,
        });
      }
    }
  }

  return accounts;
}

/**
 * Subscribe a page to webhook events (messaging, feed)
 */
export async function subscribePageWebhook(pageId: string, pageToken: string): Promise<boolean> {
  const res = await fetch(`${GRAPH_API}/${pageId}/subscribed_apps`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pageToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      subscribed_fields: ["messages", "messaging_postbacks", "feed"],
    }),
  });
  return res.ok;
}

/**
 * Unsubscribe a page from webhook events
 */
export async function unsubscribePageWebhook(pageId: string, pageToken: string): Promise<boolean> {
  const res = await fetch(`${GRAPH_API}/${pageId}/subscribed_apps`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${pageToken}` },
  });
  return res.ok;
}
