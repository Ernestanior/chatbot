export interface HelpEntry {
  title: string;
  description: string;
  usage: string;
  example?: string;
}

export const helpContent: Record<string, HelpEntry> = {
  brands: {
    title: "品牌管理",
    description:
      "品牌是您在 ChatBotAI 中管理的业务单位。每个品牌拥有独立的 AI 笔记本、平台帐号、对话和设定。",
    usage:
      "点击「新增品牌」建立品牌，输入品牌名称即可。建立后点击品牌卡片可切换当前操作的品牌。",
    example:
      "例如：您经营「小美牛肉面」和「小美咖啡」两个品牌，可分别建立并各自设定 AI 回覆规则。",
  },
  notebook: {
    title: "AI 笔记本",
    description:
      "笔记本是 AI 回覆客户的知识来源。它分为多个模块：品牌资讯、产品目录、常见问题、语气设定、转接规则等。",
    usage:
      '选择左侧模块后在右侧编辑内容，写完后点击「保存」。可使用「AI 检查」功能让 AI 帮你找出内容中的问题，也可以用「AI 生成向导」一键生成初始内容。',
    example:
      "在「常见问题」模块写入：\nQ: 你们营业时间？\nA: 周一至周五 10:00-22:00，周末 11:00-21:00",
  },
  messages: {
    title: "讯息中心",
    description:
      "这里显示所有来自 Facebook / Instagram 的客户对话。AI 会自动回覆，您也可以随时接管。",
    usage:
      "左侧选择对话，右侧查看聊天记录。点击「接管对话」后 AI 暂停回覆，由您手动回覆。点击「交回 AI」恢复自动回覆。",
  },
  triggers: {
    title: "留言触发",
    description:
      "当客户在贴文下方留言包含特定关键词或 Hashtag 时，自动发送私讯给该客户。常用于行销活动。",
    usage:
      "点击「新增触发器」，选择触发类型（关键词或 Hashtag），填写触发条件和要发送的私讯内容。可选择让 AI 生成个性化回覆。",
    example:
      '例如：客户在贴文留言「+1」时，自动私讯发送优惠券连结。',
  },
  insights: {
    title: "效果反馈",
    description:
      "查看 AI 回覆的整体表现数据，包括对话量、消息量、AI 回覆率、未覆盖的话题等。",
    usage:
      '使用右上角的时间筛选器切换统计周期。关注「未覆盖话题」区块，这些是 AI 无法回答的问题，建议补充到笔记本中。',
  },
  "settings/auth": {
    title: "平台授权",
    description:
      "连接您的 Facebook 粉丝专页或 Instagram 商业帐号，让 AI 能够接收和回覆讯息。",
    usage:
      '点击「探索可连接帐号」，系统会列出您 Facebook 帐号下的所有粉丝专页和 Instagram 帐号。选择要连接的帐号点击「连接」即可。',
  },
  "settings/reply": {
    title: "回覆设定",
    description:
      "控制 AI 回覆的行为参数，包括频率限制、回覆概率、休息时间等。",
    usage:
      "调整各项参数后点击「保存」。频率限制可防止 AI 过度回覆同一用户；休息时间内 AI 不会自动回覆；模拟打字延迟让回覆更自然。",
  },
};
