import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 mb-6"
    >
      <div className="min-w-0">
        {eyebrow && (
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary/80">
            {eyebrow}
          </div>
        )}
        <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">
          <span className="gradient-text">{title}</span>
        </h2>
        {description && (
          <p className="mt-1.5 text-sm text-muted-foreground max-w-2xl">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </motion.div>
  );
}

export function Panel({
  title,
  subtitle,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-[var(--gradient-card)] p-4 sm:p-5 shadow-[var(--shadow-elegant)]",
        className,
      )}
    >
      {(title || subtitle) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h3 className="text-sm font-semibold tracking-wide">{title}</h3>}
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
