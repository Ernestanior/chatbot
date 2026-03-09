"use client";

import { useEffect, useState, useCallback } from "react";
import { useBrand } from "@/components/brand-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { HelpTip } from "@/components/help-tip";

interface Trigger {
  id: string;
  name: string;
  triggerType: "HASHTAG" | "KEYWORD";
  postId: string | null;
  hashtag: string | null;
  keywords: string[];
  dmContent: string | null;
  commentReply: string | null;
  useAI: boolean;
  isActive: boolean;
  createdAt: string;
}

const emptyForm = {
  name: "",
  triggerType: "KEYWORD" as "HASHTAG" | "KEYWORD",
  postId: "",
  hashtag: "",
  keywords: "",
  dmContent: "",
  commentReply: "",
  useAI: false,
};

export default function TriggersPage() {
  const { currentBrand } = useBrand();
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchTriggers = useCallback(async () => {
    if (!currentBrand) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/comment-triggers?brandId=${currentBrand.id}`);
      if (res.ok) setTriggers(await res.json());
    } finally {
      setLoading(false);
    }
  }, [currentBrand]);

  useEffect(() => { fetchTriggers(); }, [fetchTriggers]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(t: Trigger) {
    setEditingId(t.id);
    setForm({
      name: t.name,
      triggerType: t.triggerType,
      postId: t.postId ?? "",
      hashtag: t.hashtag ?? "",
      keywords: t.keywords.join(", "),
      dmContent: t.dmContent ?? "",
      commentReply: t.commentReply ?? "",
      useAI: t.useAI,
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!currentBrand) return;
    setSaving(true);
    try {
      const payload = {
        brandId: currentBrand.id,
        name: form.name,
        triggerType: form.triggerType,
        postId: form.postId || null,
        hashtag: form.triggerType === "HASHTAG" ? form.hashtag : null,
        keywords: form.triggerType === "KEYWORD" ? form.keywords.split(",").map((k) => k.trim()).filter(Boolean) : [],
        dmContent: form.dmContent || null,
        commentReply: form.commentReply || null,
        useAI: form.useAI,
      };

      const url = editingId ? `/api/comment-triggers/${editingId}` : "/api/comment-triggers";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        setShowForm(false);
        fetchTriggers();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    await fetch(`/api/comment-triggers/${id}`, {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    fetchTriggers();
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除此触发器？")) return;
    await fetch(`/api/comment-triggers/${id}`, { method: "DELETE" });
    fetchTriggers();
  }

  if (!currentBrand) {
    return <div className="text-sm text-muted-foreground">请先选择品牌</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">留言触发私讯</h1>
          <HelpTip pageKey="triggers" />
        </div>
        <Button size="sm" onClick={openCreate}>新增触发器</Button>
      </div>

      {/* ── Form ── */}
      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {editingId ? "编辑触发器" : "新增触发器"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>名称</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="例：新品上市活动" />
              </div>
              <div className="space-y-2">
                <Label>触发类型</Label>
                <Select value={form.triggerType} onValueChange={(v) => setForm({ ...form, triggerType: v as "HASHTAG" | "KEYWORD" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KEYWORD">关键词匹配</SelectItem>
                    <SelectItem value="HASHTAG">Hashtag 匹配</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.triggerType === "KEYWORD" ? (
              <div className="space-y-2">
                <Label>关键词（逗号分隔）</Label>
                <Input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="价格, 多少钱, 怎么买" />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Hashtag</Label>
                <Input value={form.hashtag} onChange={(e) => setForm({ ...form, hashtag: e.target.value })} placeholder="#新品上市" />
              </div>
            )}

            <div className="space-y-2">
              <Label>限定贴文 ID（可选）</Label>
              <Input value={form.postId} onChange={(e) => setForm({ ...form, postId: e.target.value })} placeholder="留空则匹配所有贴文" />
            </div>

            <div className="space-y-2">
              <Label>留言回覆内容（可选）</Label>
              <Textarea value={form.commentReply} onChange={(e) => setForm({ ...form, commentReply: e.target.value })} placeholder="公开回覆留言的内容" rows={2} />
            </div>

            <div className="space-y-2">
              <Label>私讯内容</Label>
              <Textarea value={form.dmContent} onChange={(e) => setForm({ ...form, dmContent: e.target.value })} placeholder="发送给留言者的私讯内容" rows={3} />
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.useAI} onCheckedChange={(v) => setForm({ ...form, useAI: v })} />
              <Label>使用 AI 生成私讯内容（覆盖静态内容）</Label>
            </div>

            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={handleSave} disabled={saving || !form.name}>
                {saving ? "保存中..." : "保存"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>取消</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Trigger List ── */}
      {loading && triggers.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center">加载中...</div>
      ) : triggers.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center">暂无触发器，点击上方按钮新增</div>
      ) : (
        <div className="space-y-3">
          {triggers.map((t) => (
            <Card key={t.id}>
              <CardContent className="py-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{t.name || "未命名"}</span>
                    <Badge variant={t.triggerType === "KEYWORD" ? "default" : "secondary"} className="text-[10px]">
                      {t.triggerType === "KEYWORD" ? "关键词" : "Hashtag"}
                    </Badge>
                    {t.useAI && <Badge variant="outline" className="text-[10px]">AI</Badge>}
                    {!t.isActive && <Badge variant="destructive" className="text-[10px]">已停用</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {t.triggerType === "KEYWORD"
                      ? `关键词: ${t.keywords.join(", ")}`
                      : `Hashtag: ${t.hashtag}`}
                    {t.postId && ` · 贴文: ${t.postId.slice(0, 15)}...`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch checked={t.isActive} onCheckedChange={(v) => handleToggle(t.id, v)} />
                  <Button size="sm" variant="ghost" onClick={() => openEdit(t)}>编辑</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(t.id)}>删除</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
