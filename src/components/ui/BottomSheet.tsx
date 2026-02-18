"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-2xl max-h-[85vh] flex flex-col animate-slide-up"
      >
        {/* Handle + Header */}
        <div className="flex-shrink-0 pt-3 pb-2 px-4">
          <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
            >
              <X size={16} className="text-text-secondary" />
            </button>
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  );
}
