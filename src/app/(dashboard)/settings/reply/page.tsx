"use client";

import { useState, useEffect, useCallback } from "react";
import { useBrand } from "@/components/brand-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { HelpTip } from "@/components/help-tip";
import { toast } from "sonner";

interface ReplySettings {
  dmFrequencyLimit: number | null;
  dmFrequencyWindowMins: number | null;
  replyProbability: number;
  restTimeStart: string | null;
  restTimeEnd: string | null;
  restTimeTimezone: string;
  contextWindowSize: number;
  simulateTypingDelay: boolean;
  spamFilter: boolean;
}

const defaults: ReplySettings = {
  dmFrequencyLimit: null,
  dmFrequencyWindowMins: null,
  replyProbability: 100,
  restTimeStart: null,
  restTimeEnd: null,
  restTimeTimezone: "Asia/Taipei",
  contextWindowSize: 20,
  simulateTypingDelay: false,
  spamFilter: false,
};

export default function SettingsReplyPage() {
  const { currentBrand } = useBrand();
  const [settings, setSettings] = useState<ReplySettings>(defaults);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!currentBrand) return;
    const res = await fetch(`/api/settings/reply?brandId=${currentBrand.id}`);
    if (res.ok) {
      const data = await res.json();
      setSettings({ ...defaults, ...data });
    }
  }, [currentBrand]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    if (!currentBrand) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings/reply", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: currentBrand.id, ...settings }),
      });
      if (res.ok) toast.success("已保存");
      else toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const update = <K extends keyof ReplySettings>(key: K, value: ReplySettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (!currentBrand) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        请先选择或创建一个品牌
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">回覆设定</h1>
          <HelpTip pageKey="settings/reply" />
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "保存中..." : "保存"}
        </Button>
      </div>

      {/* Frequency Limit */}
      <Card className="p-4 space-y-4">
        <h2 className="font-semibold text-sm">频率限制</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>最大回覆次数</Label>
            <Input
              type="number"
              min={0}
              placeholder="不限制"
              value={settings.dmFrequencyLimit ?? ""}
              onChange={(e) =>
                update("dmFrequencyLimit", e.target.value ? Number(e.target.value) : null)
              }
            />
          </div>
          <div className="space-y-1">
            <Label>时间窗口（分钟）</Label>
            <Input
              type="number"
              min={1}
              placeholder="60"
              value={settings.dmFrequencyWindowMins ?? ""}
              onChange={(e) =>
                update("dmFrequencyWindowMins", e.target.value ? Number(e.target.value) : null)
              }
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          限制 AI 在指定时间窗口内对同一用户的最大回覆次数
        </p>
      </Card>

      {/* Reply Probability */}
      <Card className="p-4 space-y-4">
        <h2 className="font-semibold text-sm">回覆概率</h2>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            min={0}
            max={100}
            className="w-24"
            value={settings.replyProbability}
            onChange={(e) => update("replyProbability", Number(e.target.value))}
          />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
        <p className="text-xs text-muted-foreground">
          设为 100% 表示每条讯息都回覆，降低可模拟更自然的回覆频率
        </p>
      </Card>

      {/* Rest Time */}
      <Card className="p-4 space-y-4">
        <h2 className="font-semibold text-sm">休息时间</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>开始时间</Label>
            <Input
              type="time"
              value={settings.restTimeStart ?? ""}
              onChange={(e) => update("restTimeStart", e.target.value || null)}
            />
          </div>
          <div className="space-y-1">
            <Label>结束时间</Label>
            <Input
              type="time"
              value={settings.restTimeEnd ?? ""}
              onChange={(e) => update("restTimeEnd", e.target.value || null)}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          休息时间内 AI 不会自动回覆，时区：{settings.restTimeTimezone}
        </p>
      </Card>

      {/* Context & Behavior */}
      <Card className="p-4 space-y-4">
        <h2 className="font-semibold text-sm">行为设定</h2>
        <div className="space-y-1">
          <Label>上下文窗口大小</Label>
          <Input
            type="number"
            min={1}
            max={50}
            className="w-24"
            value={settings.contextWindowSize}
            onChange={(e) => update("contextWindowSize", Number(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">
            AI 回覆时参考的历史讯息数量
          </p>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">模拟打字延迟</p>
            <p className="text-xs text-muted-foreground">让回覆看起来更像真人</p>
          </div>
          <Switch
            checked={settings.simulateTypingDelay}
            onCheckedChange={(v) => update("simulateTypingDelay", v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">垃圾讯息过滤</p>
            <p className="text-xs text-muted-foreground">自动忽略明显的垃圾讯息</p>
          </div>
          <Switch
            checked={settings.spamFilter}
            onCheckedChange={(v) => update("spamFilter", v)}
          />
        </div>
      </Card>
    </div>
  );
}
