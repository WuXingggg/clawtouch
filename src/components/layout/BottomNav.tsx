"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  MessageCircle,
  BarChart3,
  Puzzle,
  Clock,
} from "lucide-react";

const tabs = [
  { href: "/", icon: Home, label: "首页" },
  { href: "/chat", icon: MessageCircle, label: "聊天" },
  { href: "/tokens", icon: BarChart3, label: "Token" },
  { href: "/skills", icon: Puzzle, label: "Skills" },
  { href: "/cron", icon: Clock, label: "定时" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center w-16 h-full gap-0.5 transition-colors ${
                isActive ? "text-primary" : "text-text-secondary"
              }`}
            >
              <tab.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
