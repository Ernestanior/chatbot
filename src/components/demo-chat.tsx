"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const demoResponses: Record<string, string> = {
  "你好": "你好！我是 ChatBotAI 智能客服助手。我可以帮您解答关于产品、服务的问题，处理订单查询等。请问有什么可以帮到您的吗？",
  "营业时间": "我们的营业时间是每天 9:00 - 22:00。不过别担心，AI 客服 24/7 全天候在线，随时为您服务！",
  "价格": "我们提供多种套餐选择：\n• 基础版：免费试用\n• 专业版：¥299/月\n• 企业版：¥999/月\n\n所有套餐都包含 AI 自动回复、多平台支持等核心功能。",
  "功能": "ChatBotAI 的核心功能包括：\n✨ AI 智能回复\n🔗 多平台整合（Facebook、Instagram）\n📊 数据分析\n⚡ 自动触发规则\n📝 知识库管理",
  "default": "感谢您的提问！这是一个演示对话。实际使用时，AI 会根据您配置的品牌信息和知识库，提供更加个性化和准确的回复。立即注册体验完整功能吧！"
};

export function DemoChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "👋 欢迎体验 ChatBotAI！我是智能客服助手。试试问我：营业时间、价格、功能等问题吧！"
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI thinking
    await new Promise(resolve => setTimeout(resolve, 800));

    // Find matching response
    let response = demoResponses.default;
    for (const [key, value] of Object.entries(demoResponses)) {
      if (input.includes(key)) {
        response = value;
        break;
      }
    }

    const assistantMessage: Message = { role: "assistant", content: response };
    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="flex h-[500px] flex-col overflow-hidden">
      <div className="border-b bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
            🤖
          </div>
          <div>
            <h3 className="font-semibold">AI 客服助手</h3>
            <p className="text-xs text-white/80">在线 • 即时回复</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-muted text-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl bg-muted px-4 py-2">
                <div className="flex gap-1">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce delay-100">●</span>
                  <span className="animate-bounce delay-200">●</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息..."
            className="flex-1"
            disabled={isTyping}
          />
          <Button onClick={handleSend} disabled={isTyping || !input.trim()}>
            发送
          </Button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          这是演示对话，实际使用时 AI 会根据您的配置提供个性化回复
        </p>
      </div>
    </Card>
  );
}