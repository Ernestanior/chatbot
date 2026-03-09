"use client";

import { useState, useEffect, useCallback } from "react";
import { useBrand } from "@/components/brand-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HelpTip } from "@/components/help-tip";
import { toast } from "sonner";

interface PlatformAccount {
  id: string;
  platform: "FACEBOOK" | "INSTAGRAM";
  platformUserId: string;
  platformName: string;
  isActive: boolean;
  tokenExpiresAt: string | null;
}

interface DiscoveredAccount {
  platform: "FACEBOOK" | "INSTAGRAM";
  platformUserId: string;
  platformName: string;
  accessToken: string;
  pageId?: string;
}

export default function SettingsAuthPage() {
  const { currentBrand } = useBrand();
  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
  const [discovered, setDiscovered] = useState<DiscoveredAccount[]>([]);
  const [discovering, setDiscovering] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    if (!currentBrand) return;
    const res = await fetch(`/api/platform/accounts?brandId=${currentBrand.id}`);
    if (res.ok) setAccounts(await res.json());
  }, [currentBrand]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleDiscover = async () => {
    setDiscovering(true);
    setDiscovered([]);
    try {
      const res = await fetch("/api/platform/discover", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        // Filter out already connected
        const connectedIds = new Set(accounts.map((a) => a.platformUserId));
        setDiscovered(data.filter((d: DiscoveredAccount) => !connectedIds.has(d.platformUserId)));
      } else {
        const err = await res.json();
        toast.error(err.error || "探索失败");
      }
    } finally {
      setDiscovering(false);
    }
  };

  const handleConnect = async (d: DiscoveredAccount) => {
    if (!currentBrand) return;
    setConnecting(d.platformUserId);
    try {
      const res = await fetch("/api/platform/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: currentBrand.id,
          platform: d.platform,
          platformUserId: d.platformUserId,
          platformName: d.platformName,
          accessToken: d.accessToken,
        }),
      });
      if (res.ok) {
        toast.success(`已连接 ${d.platformName}`);
        setDiscovered((prev) => prev.filter((x) => x.platformUserId !== d.platformUserId));
        fetchAccounts();
      } else {
        toast.error("连接失败");
      }
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    if (!confirm("确定要断开此帐号？")) return;
    const res = await fetch("/api/platform/accounts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId }),
    });
    if (res.ok) {
      toast.success("已断开");
      fetchAccounts();
    } else {
      toast.error("断开失败");
    }
  };

  if (!currentBrand) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        请先选择或创建一个品牌
      </div>
    );
  }

  const isExpiringSoon = (date: string | null) => {
    if (!date) return false;
    const diff = new Date(date).getTime() - Date.now();
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000; // 7 days
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">平台授权</h1>
          <HelpTip pageKey="settings/auth" />
        </div>
        <Button onClick={handleDiscover} disabled={discovering}>
          {discovering ? "探索中..." : "🔍 探索可连接帐号"}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        连接你的 Facebook 粉丝专页或 Instagram 商业帐号，让 AI 自动回覆讯息
      </p>

      {/* Connected Accounts */}
      {accounts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">已连接帐号</h2>
          {accounts.map((a) => (
            <Card key={a.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">
                  {a.platform === "FACEBOOK" ? "📘" : "📸"}
                </span>
                <div>
                  <p className="font-medium">{a.platformName}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{a.platform}</Badge>
                    {a.tokenExpiresAt && isExpiringSoon(a.tokenExpiresAt) && (
                      <Badge variant="destructive">Token 即将过期</Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDisconnect(a.id)}
              >
                断开
              </Button>
            </Card>
          ))}
        </div>
      )}

      {accounts.length === 0 && !discovering && discovered.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          <p>尚未连接任何帐号</p>
          <p className="text-sm mt-1">点击上方「探索可连接帐号」开始</p>
        </Card>
      )}

      {/* Discovered Accounts */}
      {discovered.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">可连接帐号</h2>
          {discovered.map((d) => (
            <Card key={d.platformUserId} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">
                  {d.platform === "FACEBOOK" ? "📘" : "📸"}
                </span>
                <div>
                  <p className="font-medium">{d.platformName}</p>
                  <Badge variant="outline" className="text-xs">{d.platform}</Badge>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => handleConnect(d)}
                disabled={connecting === d.platformUserId}
              >
                {connecting === d.platformUserId ? "连接中..." : "连接"}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
