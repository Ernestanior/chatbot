"use client";

import { useEffect, useState, useCallback } from "react";
import { useBrand } from "@/components/brand-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HelpTip } from "@/components/help-tip";

interface InsightsData {
  period: { days: number; since: string };
  conversations: {
    total: number;
    newInPeriod: number;
    byStatus: { aiActive: number; humanTakeover: number; closed: number };
  };
  messages: {
    total: number;
    ai: number;
    human: number;
    contact: number;
    aiReplyRate: number;
  };
  quality: { flaggedConversations: number };
  uncoveredTopics: Array<{
    id: string;
    topic: string;
    count: number;
    suggestedSection: string | null;
    createdAt: string;
  }>;
  customers: number;
  trend: Array<{ day: string; count: number }>;
}

export default function InsightsPage() {
  const { currentBrand } = useBrand();
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState("7");

  const fetchData = useCallback(async () => {
    if (!currentBrand) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/insights?brandId=${currentBrand.id}&days=${days}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [currentBrand, days]);
  useEffect(() => { fetchData(); }, [fetchData]);

  if (!currentBrand) {
    return <div className="text-sm text-muted-foreground">请先选择品牌</div>;
  }

  const conv = data?.conversations;
  const msg = data?.messages;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">效果反馈</h1>
          <HelpTip pageKey="insights" />
        </div>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">今天</SelectItem>
            <SelectItem value="7">近 7 天</SelectItem>
            <SelectItem value="14">近 14 天</SelectItem>
            <SelectItem value="30">近 30 天</SelectItem>
            <SelectItem value="90">近 90 天</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading && !data ? (
        <div className="text-sm text-muted-foreground py-8 text-center">加载中...</div>
      ) : data ? (
        <>
          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="总对话数" value={conv!.total} sub={`期间新增 ${conv!.newInPeriod}`} />
            <StatCard title="消息总量" value={msg!.total} sub={`AI ${msg!.ai} / 真人 ${msg!.human}`} />
            <StatCard title="AI 回覆率" value={`${msg!.aiReplyRate}%`} sub={`客户消息 ${msg!.contact} 条`} />
            <StatCard title="客户数" value={data.customers} sub={`质量标记 ${data.quality.flaggedConversations}`} />
          </div>
          {/* ── Conversation Status Breakdown ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">对话状态分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <StatusBar label="AI 处理中" count={conv!.byStatus.aiActive} total={conv!.total} color="bg-blue-500" />
                  <StatusBar label="真人接管" count={conv!.byStatus.humanTakeover} total={conv!.total} color="bg-amber-500" />
                  <StatusBar label="已关闭" count={conv!.byStatus.closed} total={conv!.total} color="bg-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">消息趋势（每日）</CardTitle>
              </CardHeader>
              <CardContent>
                {data.trend.length === 0 ? (
                  <p className="text-xs text-muted-foreground">暂无数据</p>
                ) : (
                  <MiniBarChart data={data.trend} />
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Uncovered Topics ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                未覆盖话题
                {data.uncoveredTopics.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-[10px]">
                    {data.uncoveredTopics.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.uncoveredTopics.length === 0 ? (
                <p className="text-xs text-muted-foreground">暂无未覆盖话题，笔记本覆盖良好 🎉</p>
              ) : (
                <div className="space-y-2">
                  {data.uncoveredTopics.map((t) => (
                    <div key={t.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{t.topic}</span>
                        {t.suggestedSection && (
                          <Badge variant="outline" className="text-[10px]">
                            建议: {t.suggestedSection}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{t.count} 次</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

// ─── Sub-components ───

function StatCard({ title, value, sub }: { title: string; value: string | number; sub: string }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

function StatusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span className="text-muted-foreground">{count} ({pct}%)</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MiniBarChart({ data }: { data: Array<{ day: string; count: number }> }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((d) => (
        <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-blue-500 rounded-t min-h-[2px]"
            style={{ height: `${(d.count / max) * 100}%` }}
            title={`${d.day}: ${d.count} 条`}
          />
          <span className="text-[9px] text-muted-foreground truncate w-full text-center">
            {d.day.slice(5)}
          </span>
        </div>
      ))}
    </div>
  );
}
