import { Inbox } from "lucide-react";

interface EmptyProps {
  message?: string;
}

export function Empty({ message = "暂无数据" }: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
      <Inbox size={48} strokeWidth={1} />
      <p className="mt-3 text-sm">{message}</p>
    </div>
  );
}
