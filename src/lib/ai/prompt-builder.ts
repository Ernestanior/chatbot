import type { NotebookSection } from "@/generated/prisma/client";

const SECTION_LABELS: Record<string, string> = {
  BRAND_INFO: "品牌信息",
  PRODUCTS: "产品与服务",
  FAQ: "常见问答",
  TONE: "语气与人设",
  ESCALATION: "转接真人规则",
  OFF_TOPIC: "离题处理",
  CUSTOM: "自定义规则",
};

export function buildSystemPrompt(
  sections: NotebookSection[],
  customerContext?: string
): string {
  const activeSections = sections
    .filter((s) => s.isActive && s.plainText.trim())
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const parts: string[] = [
    "你是一个 AI 客服助手。请严格遵守以下规则来回覆客户讯息。",
    "",
  ];

  for (const section of activeSections) {
    const label = SECTION_LABELS[section.sectionType] ?? section.title;
    parts.push(`## ${label}`);
    parts.push(section.plainText.trim());
    parts.push("");
  }

  parts.push("## 回覆要求");
  parts.push("- 只回覆文字内容，不要加任何前缀或角色标注");
  parts.push("- 如果无法回答，请按照转接规则处理");
  parts.push("- 保持简洁友善，不要编造信息");

  if (customerContext) {
    parts.push("");
    parts.push("## 客户背景");
    parts.push(customerContext);
  }

  return parts.join("\n");
}
