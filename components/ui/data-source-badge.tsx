import * as React from "react";
import { cn } from "./card";
import { Database, Cpu, HelpCircle, Radio, AlertCircle } from "lucide-react";

export type DataSourceType = "DATABASE" | "REALTIME" | "CALCULATED" | "NOT_CONFIGURED" | "EMPTY_STATE";

export interface DataSourceBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  type: DataSourceType;
  label?: string;
}

export function DataSourceBadge({ className, type, label, ...props }: DataSourceBadgeProps) {
  const configs: Record<
    DataSourceType,
    { text: string; icon: React.ComponentType<{ className?: string }>; style: string }
  > = {
    DATABASE: {
      text: label || "SUPABASE DB",
      icon: Database,
      style: "bg-blue-950/80 text-blue-400 border-blue-800",
    },
    REALTIME: {
      text: label || "LIVE REALTIME",
      icon: Radio,
      style: "bg-emerald-950/80 text-emerald-400 border-emerald-800",
    },
    CALCULATED: {
      text: label || "ENGINE CALCULATED",
      icon: Cpu,
      style: "bg-purple-950/80 text-purple-300 border-purple-800",
    },
    NOT_CONFIGURED: {
      text: label || "NOT CONFIGURED",
      icon: AlertCircle,
      style: "bg-amber-950/80 text-amber-400 border-amber-800",
    },
    EMPTY_STATE: {
      text: label || "INSUFFICIENT DATA",
      icon: HelpCircle,
      style: "bg-slate-900 text-slate-400 border-slate-700",
    },
  };

  const config = configs[type] || configs.DATABASE;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-mono font-semibold transition-colors",
        config.style,
        className
      )}
      {...props}
    >
      <Icon className="w-3 h-3" />
      <span>{config.text}</span>
    </div>
  );
}
