import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = "", onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-card rounded-2xl p-4 shadow-sm ${
        onClick ? "active:scale-[0.98] transition-transform cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
