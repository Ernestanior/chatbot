"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BrandSwitcher } from "@/components/brand-switcher";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/dashboard", label: "概览", icon: "📊" },
  { href: "/brands", label: "品牌管理", icon: "🏢" },
  { href: "/notebook", label: "AI 笔记本", icon: "📝" },
  { href: "/messages", label: "讯息中心", icon: "💬" },
  { href: "/triggers", label: "留言触发", icon: "⚡" },
  { href: "/insights", label: "效果反馈", icon: "📈" },
  { href: "/settings/auth", label: "平台授权", icon: "🔗" },
  { href: "/settings/reply", label: "回覆设定", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="text-lg font-semibold">
          ChatBotAI
        </Link>
      </div>
      <div className="p-3">
        <BrandSwitcher />
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
