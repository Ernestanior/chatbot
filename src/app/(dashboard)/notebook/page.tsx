"use client";

import { useState, useEffect, useCallback } from "react";
import { useBrand } from "@/components/brand-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HelpTip } from "@/components/help-tip";
import { toast } from "sonner";

interface Section {
  id: string;
  sectionType: string;
  title: string;
  plainText: string;
  isActive: boolean;
  sortOrder: number;
}

interface LintIssue {
  section: string;
  severity: "error" | "warning" | "info";
  message: string;
  suggestion: string;
}

const SECTION_ICONS: Record<string, string> = {
  BRAND_INFO: "🏢",
  PRODUCTS: "📦",
  FAQ: "❓",
  TONE: "🎭",
  ESCALATION: "🔀",
  OFF_TOPIC: "🚫",
  CUSTOM: "⚙️",
};

export default function NotebookPage() {
  const { currentBrand } = useBrand();
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [linting, setLinting] = useState(false);
  const [lintIssues, setLintIssues] = useState<LintIssue[]>([]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardDesc, setWizardDesc] = useState("");
  const [wizardLoading, setWizardLoading] = useState(false);

  // Global AI config state
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiConfigLoading, setAiConfigLoading] = useState(false);

  // Test panel state
  const [testMessage, setTestMessage] = useState("");
  const [testReply, setTestReply] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [testMeta, setTestMeta] = useState<{ provider: string; latencyMs: number } | null>(null);

  const fetchSections = useCallback(async () => {
    if (!currentBrand) return;
    const res = await fetch(`/api/notebook/sections?brandId=${currentBrand.id}`);
    if (res.ok) {
      const data = await res.json();
      setSections(data);
      if (data.length > 0 && !activeSection) setActiveSection(data[0].id);
    }
  }, [currentBrand, activeSection]);

  const fetchAiConfig = useCallback(async () => {
    if (!currentBrand) return;
    const res = await fetch(`/api/notebook/config?brandId=${currentBrand.id}`);
    if (res.ok) {
      const data = await res.json();
      setAiEnabled(data?.isActive ?? false);
    }
  }, [currentBrand]);

  useEffect(() => {
    fetchSections();
    fetchAiConfig();
  }, [fetchSections, fetchAiConfig]);

  const currentSection = sections.find((s) => s.id === activeSection);

  const handleSave = async (section: Section) => {
    setSaving(true);
    try {
      const res = await fetch("/api/notebook/sections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId: section.id, plainText: section.plainText }),
      });
      if (res.ok) {
        toast.success("已保存");
      } else {
        toast.error("保存失败");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (sectionId: string) => {
    const res = await fetch("/api/notebook/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectionId }),
    });
    if (res.ok) {
      setSections((prev) =>
        prev.map((s) => (s.id === sectionId ? { ...s, isActive: !s.isActive } : s))
      );
    }
  };

  const handleAiToggle = async (enabled: boolean) => {
    if (!currentBrand) return;
    setAiConfigLoading(true);
    try {
      const res = await fetch("/api/notebook/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: currentBrand.id, isActive: enabled }),
      });
      if (res.ok) {
        setAiEnabled(enabled);
        toast.success(enabled ? "AI 自动回复已启用" : "AI 自动回复已停用");
      } else {
        toast.error("操作失败");
      }
    } finally {
      setAiConfigLoading(false);
    }
  };

  const handleLint = async () => {
    if (!currentBrand) return;
    setLinting(true);
    try {
      const res = await fetch("/api/notebook/lint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: currentBrand.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setLintIssues(data.issues ?? []);
        toast.success(`检查完成，发现 ${data.issues?.length ?? 0} 个问题`);
      }
    } finally {
      setLinting(false);
    }
  };

  const handleWizard = async () => {
    if (!currentBrand || !wizardDesc.trim()) return;
    setWizardLoading(true);
    try {
      const res = await fetch("/api/notebook/wizard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: currentBrand.id, description: wizardDesc }),
      });
      if (res.ok) {
        toast.success("笔记本内容已生成");
        setWizardOpen(false);
        setWizardDesc("");
        fetchSections();
      } else {
        toast.error("生成失败");
      }
    } finally {
      setWizardLoading(false);
    }
  };

  const handleSnapshot = async () => {
    if (!currentBrand) return;
    const res = await fetch("/api/notebook/versions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandId: currentBrand.id }),
    });
    if (res.ok) toast.success("版本快照已保存");
    else toast.error("快照失败");
  };

  const handleTest = async () => {
    if (!currentBrand || !testMessage.trim()) return;
    setTestLoading(true);
    setTestReply("");
    setTestMeta(null);
    try {
      const res = await fetch("/api/test/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: currentBrand.id, message: testMessage }),
      });
      if (res.ok) {
        const data = await res.json();
        setTestReply(data.reply);
        setTestMeta({ provider: data.provider, latencyMs: data.latencyMs });
      } else {
        toast.error("测试失败");
      }
    } finally {
      setTestLoading(false);
    }
  };

  if (!currentBrand) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        请先选择或创建一个品牌
      </div>
    );
  }

  // RENDER
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">AI 笔记本</h1>
          <HelpTip pageKey="notebook" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setWizardOpen(!wizardOpen)}>
            ✨ AI 生成
          </Button>
          <Button variant="outline" size="sm" onClick={handleLint} disabled={linting}>
            {linting ? "检查中..." : "🔍 AI 自检"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleSnapshot}>
            📸 保存版本
          </Button>
        </div>
      </div>

      {/* Global AI Toggle */}
      <Card className={`p-4 ${aiEnabled ? "border-green-500 bg-green-50 dark:bg-green-950" : "border-orange-500 bg-orange-50 dark:bg-orange-950"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`text-2xl ${aiEnabled ? "" : "grayscale opacity-50"}`}>
              🤖
            </div>
            <div>
              <h3 className="font-semibold text-sm">
                AI 自动回复 {aiEnabled ? "已启用" : "已停用"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {aiEnabled
                  ? "当前品牌的 AI 客服正在运行，会自动回复客户消息"
                  : "AI 客服已停用，不会自动回复客户消息（消息仍会保存）"}
              </p>
            </div>
          </div>
          <Switch
            checked={aiEnabled}
            onCheckedChange={handleAiToggle}
            disabled={aiConfigLoading}
          />
        </div>
      </Card>

      {/* Wizard Panel */}
      {wizardOpen && (
        <Card className="p-4 space-y-3 border-dashed border-2 border-primary/30">
          <p className="text-sm text-muted-foreground">
            描述你的品牌，AI 会自动生成笔记本初始内容
          </p>
          <Textarea
            placeholder="例如：我们是一家台湾手摇饮品牌，主打珍珠奶茶和水果茶，目标客群是 18-35 岁年轻人..."
            value={wizardDesc}
            onChange={(e) => setWizardDesc(e.target.value)}
            rows={3}
          />
          <Button onClick={handleWizard} disabled={wizardLoading || !wizardDesc.trim()}>
            {wizardLoading ? "生成中..." : "开始生成"}
          </Button>
        </Card>
      )}

      {/* Lint Issues */}
      {lintIssues.length > 0 && (
        <Card className="p-4 space-y-2">
          <h3 className="font-semibold text-sm">自检结果</h3>
          {lintIssues.map((issue, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <Badge
                variant={
                  issue.severity === "error"
                    ? "destructive"
                    : issue.severity === "warning"
                      ? "secondary"
                      : "outline"
                }
              >
                {issue.severity}
              </Badge>
              <div>
                <span className="font-medium">{issue.section}：</span>
                {issue.message}
                {issue.suggestion && (
                  <p className="text-muted-foreground mt-0.5">💡 {issue.suggestion}</p>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="editor" className="w-full">
        <TabsList>
          <TabsTrigger value="editor">编辑器</TabsTrigger>
          <TabsTrigger value="test">模拟测试</TabsTrigger>
        </TabsList>

        <TabsContent value="editor">
          <div className="grid grid-cols-12 gap-4">
            {/* Section List */}
            <div className="col-span-3 space-y-1">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between transition-colors ${
                    activeSection === s.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <span>
                    {SECTION_ICONS[s.sectionType] ?? "📄"} {s.title}
                  </span>
                  {!s.isActive && (
                    <Badge variant="outline" className="text-xs ml-1">
                      停用
                    </Badge>
                  )}
                </button>
              ))}
            </div>

            {/* Editor */}
            <div className="col-span-9">
              {currentSection ? (
                <Card className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold">
                      {SECTION_ICONS[currentSection.sectionType]} {currentSection.title}
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {currentSection.isActive ? "启用中" : "已停用"}
                      </span>
                      <Switch
                        checked={currentSection.isActive}
                        onCheckedChange={() => handleToggle(currentSection.id)}
                      />
                    </div>
                  </div>
                  <Textarea
                    value={currentSection.plainText}
                    onChange={(e) =>
                      setSections((prev) =>
                        prev.map((s) =>
                          s.id === currentSection.id
                            ? { ...s, plainText: e.target.value }
                            : s
                        )
                      )
                    }
                    rows={16}
                    placeholder="在此输入该模块的内容..."
                    className="font-mono text-sm"
                  />
                  <div className="flex justify-end">
                    <Button onClick={() => handleSave(currentSection)} disabled={saving}>
                      {saving ? "保存中..." : "保存"}
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  选择左侧模块开始编辑
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="test">
          <Card className="p-4 space-y-4 max-w-2xl">
            <h3 className="font-semibold">模拟客户对话</h3>
            <p className="text-sm text-muted-foreground">
              输入一条客户讯息，测试 AI 会如何回覆
            </p>
            <Textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="例如：请问你们有什么口味的珍珠奶茶？"
              rows={3}
            />
            <Button onClick={handleTest} disabled={testLoading || !testMessage.trim()}>
              {testLoading ? "生成中..." : "发送测试"}
            </Button>
            {testReply && (
              <div className="space-y-2">
                <div className="bg-muted rounded-lg p-3 text-sm whitespace-pre-wrap">
                  {testReply}
                </div>
                {testMeta && (
                  <p className="text-xs text-muted-foreground">
                    Provider: {testMeta.provider} · 延迟: {testMeta.latencyMs}ms
                  </p>
                )}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
