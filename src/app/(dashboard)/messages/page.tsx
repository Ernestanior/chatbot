"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useBrand } from "@/components/brand-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { HelpTip } from "@/components/help-tip";

// ─── Types ───

interface PlatformAccount {
  platform: string;
  platformName: string;
}

interface Conversation {
  id: string;
  contactName: string;
  contactPlatformId: string;
  status: "AI_ACTIVE" | "HUMAN_TAKEOVER" | "CLOSED";
  lastMessageAt: string;
  lastMessagePreview: string | null;
  unreadCount: number;
  qualityFlags: string[];
  platformAccount: PlatformAccount;
}

interface Message {
  id: string;
  senderType: "CONTACT" | "AI" | "HUMAN";
  messageType: "TEXT" | "IMAGE" | "AUDIO" | "STICKER";
  content: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface CustomerProfile {
  id: string;
  displayName: string | null;
  tags: string[];
  interactionCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  summary: string | null;
}

// ─── Status helpers ───

const statusLabel: Record<string, string> = {
  AI_ACTIVE: "AI 回覆中",
  HUMAN_TAKEOVER: "真人接管",
  CLOSED: "已关闭",
};

const statusColor: Record<string, string> = {
  AI_ACTIVE: "bg-green-500",
  HUMAN_TAKEOVER: "bg-yellow-500",
  CLOSED: "bg-gray-400",
};

// ─── Main Page ───

export default function MessagesPage() {
  const { currentBrand } = useBrand();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [convStatus, setConvStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // ─── Fetch conversation list ───
  const fetchConversations = useCallback(async () => {
    if (!currentBrand) return;
    const params = new URLSearchParams({ brandId: currentBrand.id });
    if (filterStatus !== "all") params.set("status", filterStatus);
    if (search) params.set("search", search);

    const res = await fetch(`/api/conversations?${params}`);
    if (res.ok) {
      const data = await res.json();
      setConversations(data.conversations);
    }
  }, [currentBrand, filterStatus, search]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Auto-refresh list every 5s
  useEffect(() => {
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // ─── Select conversation ───
  const selectConversation = async (id: string) => {
    setSelectedId(id);
    setLoading(true);

    const res = await fetch(`/api/conversations/${id}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.conversation.messages);
      setCustomer(data.customer);
      setConvStatus(data.conversation.status);
    }
    setLoading(false);

    // Start SSE stream
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    const es = new EventSource(`/api/conversations/${id}/stream`);
    es.addEventListener("messages", (e) => {
      const newMsgs: Message[] = JSON.parse(e.data);
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const unique = newMsgs.filter((m) => !existingIds.has(m.id));
        return unique.length > 0 ? [...prev, ...unique] : prev;
      });
    });
    es.addEventListener("status", (e) => {
      const { status } = JSON.parse(e.data);
      setConvStatus(status);
    });
    eventSourceRef.current = es;
  };

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => eventSourceRef.current?.close();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Send message ───
  const sendMessage = async () => {
    if (!input.trim() || !selectedId || sending) return;
    setSending(true);

    const res = await fetch(`/api/conversations/${selectedId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: input.trim() }),
    });

    if (res.ok) {
      const msg: Message = await res.json();
      setMessages((prev) => [...prev, msg]);
      setInput("");
      setConvStatus("HUMAN_TAKEOVER");
    }
    setSending(false);
  };

  // ─── Status actions ───
  const updateStatus = async (status: string) => {
    if (!selectedId) return;
    const res = await fetch(`/api/conversations/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setConvStatus(status);
      fetchConversations();
    }
  };

  // ─── No brand selected ───
  if (!currentBrand) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        请先选择一个品牌
      </div>
    );
  }

  const selectedConv = conversations.find((c) => c.id === selectedId);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* ─── Left: Conversation List ─── */}
      <div className="w-80 flex-shrink-0 border-r flex flex-col">
        <div className="p-3 space-y-2 border-b">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">讯息中心</span>
            <HelpTip pageKey="messages" />
          </div>
          <Input
            placeholder="搜索对话..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />
          <div className="flex gap-1">
            {["all", "AI_ACTIVE", "HUMAN_TAKEOVER", "CLOSED"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={cn(
                  "px-2 py-0.5 text-xs rounded-full transition-colors",
                  filterStatus === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {s === "all" ? "全部" : statusLabel[s]}
              </button>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              暂无对话
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={cn(
                  "w-full text-left p-3 border-b hover:bg-muted/50 transition-colors",
                  selectedId === conv.id && "bg-muted"
                )}
              >
                <div className="flex items-start gap-2">
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarFallback className="text-xs">
                      {conv.contactName?.slice(0, 2) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">
                        {conv.contactName || "未知用户"}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {formatTime(conv.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", statusColor[conv.status])} />
                      <span className="text-xs text-muted-foreground truncate">
                        {conv.lastMessagePreview || "无消息"}
                      </span>
                    </div>
                  </div>
                  {conv.unreadCount > 0 && (
                    <Badge variant="destructive" className="text-[10px] h-4 px-1">
                      {conv.unreadCount}
                    </Badge>
                  )}
                </div>
              </button>
            ))
          )}
        </ScrollArea>
      </div>

      {/* ─── PLACEHOLDER FOR CENTER + RIGHT PANELS ─── */}
      {!selectedId ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          选择一个对话开始查看
        </div>
      ) : (
        <>
          {/* ─── Center: Chat ─── */}
          <ChatPanel
            messages={messages}
            convStatus={convStatus}
            loading={loading}
            input={input}
            sending={sending}
            selectedConv={selectedConv}
            messagesEndRef={messagesEndRef}
            onInputChange={setInput}
            onSend={sendMessage}
            onUpdateStatus={updateStatus}
          />
          {/* ─── Right: Customer Info ─── */}
          <CustomerPanel customer={customer} convStatus={convStatus} />
        </>
      )}
    </div>
  );
}

// ─── Chat Panel ───

interface ChatPanelProps {
  messages: Message[];
  convStatus: string;
  loading: boolean;
  input: string;
  sending: boolean;
  selectedConv: Conversation | undefined;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onUpdateStatus: (s: string) => void;
}

function ChatPanel({
  messages, convStatus, loading, input, sending,
  selectedConv, messagesEndRef, onInputChange, onSend, onUpdateStatus,
}: ChatPanelProps) {
  const senderLabel: Record<string, string> = {
    CONTACT: "客户",
    AI: "AI",
    HUMAN: "真人客服",
  };
  const senderBg: Record<string, string> = {
    CONTACT: "bg-muted",
    AI: "bg-blue-50 dark:bg-blue-950",
    HUMAN: "bg-green-50 dark:bg-green-950",
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="h-14 border-b flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">
            {selectedConv?.contactName || "对话"}
          </span>
          <Badge variant="outline" className="text-[10px]">
            {selectedConv?.platformAccount.platform}
          </Badge>
          <span className={cn(
            "px-2 py-0.5 text-[10px] rounded-full text-white",
            statusColor[convStatus] || "bg-gray-400"
          )}>
            {statusLabel[convStatus] || convStatus}
          </span>
        </div>
        <div className="flex gap-1">
          {convStatus === "AI_ACTIVE" && (
            <Button size="sm" variant="outline" onClick={() => onUpdateStatus("HUMAN_TAKEOVER")}>
              接管对话
            </Button>
          )}
          {convStatus === "HUMAN_TAKEOVER" && (
            <Button size="sm" variant="outline" onClick={() => onUpdateStatus("AI_ACTIVE")}>
              交回 AI
            </Button>
          )}
          {convStatus !== "CLOSED" && (
            <Button size="sm" variant="ghost" onClick={() => onUpdateStatus("CLOSED")}>
              关闭
            </Button>
          )}
          {convStatus === "CLOSED" && (
            <Button size="sm" variant="outline" onClick={() => onUpdateStatus("AI_ACTIVE")}>
              重新开启
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="text-center text-sm text-muted-foreground py-8">加载中...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">暂无消息</div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.senderType === "CONTACT" ? "justify-start" : "justify-end"
                )}
              >
                <div
                  className={cn(
                    "max-w-[70%] rounded-lg px-3 py-2",
                    senderBg[msg.senderType]
                  )}
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {senderLabel[msg.senderType]}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                  {msg.messageType === "IMAGE" ? (
                    <div className="text-sm text-muted-foreground italic">[图片]</div>
                  ) : msg.messageType === "AUDIO" ? (
                    <div className="text-sm text-muted-foreground italic">[语音]</div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-3">
        {convStatus === "CLOSED" ? (
          <div className="text-center text-sm text-muted-foreground">对话已关闭</div>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder={convStatus === "AI_ACTIVE" ? "发送消息将自动接管对话..." : "输入消息..."}
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSend()}
              disabled={sending}
              className="flex-1"
            />
            <Button onClick={onSend} disabled={sending || !input.trim()} size="sm">
              {sending ? "发送中..." : "发送"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Customer Panel ───

interface CustomerPanelProps {
  customer: CustomerProfile | null;
  convStatus: string;
}

function CustomerPanel({ customer, convStatus }: CustomerPanelProps) {
  return (
    <div className="w-64 flex-shrink-0 border-l p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold mb-3">客户资料</h3>

      {!customer ? (
        <p className="text-xs text-muted-foreground">暂无客户资料</p>
      ) : (
        <div className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">名称</p>
            <p className="text-sm">{customer.displayName || "未知"}</p>
          </div>

          <Separator />

          <div>
            <p className="text-xs text-muted-foreground">互动次数</p>
            <p className="text-sm">{customer.interactionCount}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">首次互动</p>
            <p className="text-sm">{new Date(customer.firstSeenAt).toLocaleDateString("zh-CN")}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">最近互动</p>
            <p className="text-sm">{new Date(customer.lastSeenAt).toLocaleDateString("zh-CN")}</p>
          </div>

          {customer.tags.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1">标签</p>
                <div className="flex flex-wrap gap-1">
                  {customer.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {customer.summary && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1">AI 摘要</p>
                <p className="text-xs leading-relaxed">{customer.summary}</p>
              </div>
            </>
          )}
        </div>
      )}

      <Separator className="my-4" />

      <div>
        <p className="text-xs text-muted-foreground mb-1">当前状态</p>
        <span className={cn(
          "px-2 py-0.5 text-[10px] rounded-full text-white",
          statusColor[convStatus] || "bg-gray-400"
        )}>
          {statusLabel[convStatus] || convStatus}
        </span>
      </div>
    </div>
  );
}

// ─── Helpers ───

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin}分钟前`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}小时前`;

  const isThisYear = date.getFullYear() === now.getFullYear();
  if (isThisYear) {
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  }

  return date.toLocaleDateString("zh-CN");
}