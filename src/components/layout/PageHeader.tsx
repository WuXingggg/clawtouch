"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, RefreshCw } from "lucide-react";
import { type ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  onRefresh?: () => void;
  right?: ReactNode;
}

export function PageHeader({
  title,
  showBack,
  onRefresh,
  right,
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between h-12 px-4 max-w-lg mx-auto">
        <div className="w-10">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="flex items-center text-primary"
            >
              <ChevronLeft size={24} />
            </button>
          )}
        </div>
        <h1 className="text-base font-semibold">{title}</h1>
        <div className="w-10 flex justify-end">
          {onRefresh && (
            <button onClick={onRefresh} className="text-text-secondary p-1">
              <RefreshCw size={18} />
            </button>
          )}
          {right}
        </div>
      </div>
    </header>
  );
}
