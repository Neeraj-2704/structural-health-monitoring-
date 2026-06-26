import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

export interface SensorCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  unit: string;
  status: "SAFE" | "WARNING" | "DANGER";
  trend: number[];
}

const statusColors = {
  SAFE: {
    text: "text-success",
    dot: "bg-success",
    stroke: "var(--color-success)",
    border: "border-success/30",
  },
  WARNING: {
    text: "text-warning",
    dot: "bg-warning",
    stroke: "var(--color-warning)",
    border: "border-warning/30",
  },
  DANGER: {
    text: "text-danger",
    dot: "bg-danger",
    stroke: "var(--color-danger)",
    border: "border-danger/30",
  },
} as const;

export function SensorCard({ icon: Icon, label, value, unit, status, trend }: SensorCardProps) {
  const c = statusColors[status];
  const data = trend.map((v, i) => ({ i, v }));
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-[var(--gradient-card)] p-4 shadow-[var(--shadow-elegant)]",
        c.border,
      )}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className={cn("h-9 w-9 grid place-items-center rounded-lg bg-accent shrink-0")}>
            <Icon className={cn("h-4.5 w-4.5", c.text)} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              {label}
            </div>
            <div className="text-xs text-muted-foreground/70 font-mono truncate">Live</div>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase",
            c.text,
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              c.dot,
              status === "DANGER" && "pulse-dot-danger",
            )}
          />
          {status}
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-3xl font-bold font-mono tracking-tight tabular-nums">{value}</span>
        <span className="text-sm text-muted-foreground font-mono">{unit}</span>
      </div>

      <div className="mt-3 h-12 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`g-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c.stroke} stopOpacity={0.4} />
                <stop offset="100%" stopColor={c.stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={c.stroke}
              strokeWidth={1.6}
              fill={`url(#g-${label})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
