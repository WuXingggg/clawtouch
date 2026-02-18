import { Card } from "./Card";
import { type ReactNode } from "react";

interface StatCardProps {
  icon?: ReactNode;
  label: string;
  value: string | number;
  color?: string;
  sub?: string;
}

export function StatCard({ icon, label, value, color = "text-primary", sub }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="text-lg">{icon}</span>}
        <span className="text-sm text-text-secondary">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-text-secondary mt-1">{sub}</p>}
    </Card>
  );
}
