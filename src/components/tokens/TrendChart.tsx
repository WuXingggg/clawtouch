"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useT } from "@/lib/i18n";

interface TrendData {
  date: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

export function TrendChart({ data }: { data: TrendData[] }) {
  const { t } = useT();

  const chartData = data.map((d) => ({
    date: d.date.slice(5), // "MM-DD"
    tokens:
      d.inputTokens + d.outputTokens + d.cacheReadTokens + d.cacheWriteTokens,
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-sm text-text-secondary">
        {t("tokens.noData")}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={chartData}>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) =>
            v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
          }
          width={35}
        />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => [Number(value).toLocaleString(), "Tokens"]}
          labelFormatter={(label: unknown) => t("tokens.date", { label: String(label) })}
          contentStyle={{
            borderRadius: 8,
            fontSize: 12,
            border: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        />
        <Bar dataKey="tokens" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
