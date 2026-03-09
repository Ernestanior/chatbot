import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "../prompt-builder";

// Minimal mock matching NotebookSection shape
function section(overrides: Partial<{
  sectionType: string; title: string; plainText: string;
  isActive: boolean; sortOrder: number;
}>) {
  return {
    id: "s1", brandId: "b1", content: {}, createdAt: new Date(), updatedAt: new Date(),
    sectionType: "CUSTOM", title: "Custom", plainText: "", isActive: true, sortOrder: 0,
    ...overrides,
  };
}

describe("buildSystemPrompt", () => {
  it("includes active sections sorted by sortOrder", () => {
    const sections = [
      section({ sectionType: "FAQ", title: "FAQ", plainText: "Q: 多少钱？\nA: 100元", sortOrder: 2 }),
      section({ sectionType: "BRAND_INFO", title: "Brand", plainText: "我们是 ChatBotAI", sortOrder: 1 }),
    ];
    const prompt = buildSystemPrompt(sections as Parameters<typeof buildSystemPrompt>[0]);
    // BRAND_INFO (sortOrder 1) should come before FAQ (sortOrder 2)
    const brandIdx = prompt.indexOf("品牌信息");
    const faqIdx = prompt.indexOf("常见问答");
    expect(brandIdx).toBeGreaterThan(-1);
    expect(faqIdx).toBeGreaterThan(-1);
    expect(brandIdx).toBeLessThan(faqIdx);
  });

  it("excludes inactive sections", () => {
    const sections = [
      section({ sectionType: "BRAND_INFO", plainText: "Active", isActive: true, sortOrder: 1 }),
      section({ sectionType: "FAQ", plainText: "Inactive", isActive: false, sortOrder: 2 }),
    ];
    const prompt = buildSystemPrompt(sections as Parameters<typeof buildSystemPrompt>[0]);
    expect(prompt).toContain("Active");
    expect(prompt).not.toContain("Inactive");
  });

  it("excludes sections with empty plainText", () => {
    const sections = [
      section({ sectionType: "BRAND_INFO", plainText: "   ", isActive: true, sortOrder: 1 }),
      section({ sectionType: "FAQ", plainText: "Real content", isActive: true, sortOrder: 2 }),
    ];
    const prompt = buildSystemPrompt(sections as Parameters<typeof buildSystemPrompt>[0]);
    expect(prompt).not.toContain("品牌信息");
    expect(prompt).toContain("Real content");
  });

  it("appends customer context when provided", () => {
    const sections = [
      section({ sectionType: "BRAND_INFO", plainText: "Brand info", sortOrder: 1 }),
    ];
    const prompt = buildSystemPrompt(
      sections as Parameters<typeof buildSystemPrompt>[0],
      "客户名称: 小明\n互动次数: 5"
    );
    expect(prompt).toContain("## 客户背景");
    expect(prompt).toContain("小明");
  });

  it("does not include customer context section when not provided", () => {
    const sections = [
      section({ sectionType: "BRAND_INFO", plainText: "Brand info", sortOrder: 1 }),
    ];
    const prompt = buildSystemPrompt(sections as Parameters<typeof buildSystemPrompt>[0]);
    expect(prompt).not.toContain("客户背景");
  });

  it("always includes reply requirements", () => {
    const prompt = buildSystemPrompt([] as unknown as Parameters<typeof buildSystemPrompt>[0]);
    expect(prompt).toContain("回覆要求");
    expect(prompt).toContain("不要编造信息");
  });

  it("uses section title as fallback label for unknown sectionType", () => {
    const sections = [
      section({ sectionType: "MY_CUSTOM_TYPE", title: "我的自定义规则", plainText: "Rule content", sortOrder: 1 }),
    ];
    const prompt = buildSystemPrompt(sections as Parameters<typeof buildSystemPrompt>[0]);
    expect(prompt).toContain("## 我的自定义规则");
  });

  it("uses SECTION_LABELS for known CUSTOM type", () => {
    const sections = [
      section({ sectionType: "CUSTOM", title: "Ignored Title", plainText: "Rule content", sortOrder: 1 }),
    ];
    const prompt = buildSystemPrompt(sections as Parameters<typeof buildSystemPrompt>[0]);
    expect(prompt).toContain("## 自定义规则");
  });
});
