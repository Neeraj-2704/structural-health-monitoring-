import { AnimatePresence, motion } from "framer-motion";
import { AlertOctagon, Eye, ShieldCheck, X } from "lucide-react";
import type { Alert } from "@/lib/mock-data";

interface Props {
  alert: Alert | null;
  open: boolean;
  onAcknowledge: () => void;
  onClose: () => void;
}

export function AlertBanner({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="rounded-xl border border-danger/40 flash-danger text-white px-5 py-4 flex items-center gap-3 shadow-[var(--shadow-danger)]">
      <AlertOctagon className="h-6 w-6 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-sm sm:text-base font-bold tracking-wide uppercase">
          🚨 Structural Damage Detected 🚨
        </div>
        <div className="text-xs text-white/85">
          Critical reading exceeded safe operating threshold. Emergency protocol active.
        </div>
      </div>
    </div>
  );
}

export function AlertModal({ alert, open, onAcknowledge, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && alert && (
        <motion.div
          className="fixed inset-0 z-[60] grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.92, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 240 }}
            className="relative w-full max-w-lg rounded-2xl border border-danger/40 bg-card p-6 shadow-[var(--shadow-danger)]"
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-accent text-muted-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-xl bg-danger/15 grid place-items-center border border-danger/30 pulse-dot-danger">
                <AlertOctagon className="h-6 w-6 text-danger" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-danger">
                  Emergency Alert
                </div>
                <h3 className="text-lg font-bold">{alert.title}</h3>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <Field label="Alert Time" value={alert.time} />
              <Field label="Severity" value={alert.severity} accent />
              <Field label="Sensor Responsible" value={alert.sensor} />
              <Field label="Reading" value={alert.reading} mono />
            </dl>

            <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-md text-sm border border-border hover:bg-accent inline-flex items-center justify-center gap-2"
              >
                <Eye className="h-4 w-4" /> View Details
              </button>
              <button
                onClick={onAcknowledge}
                className="px-4 py-2 rounded-md text-sm font-semibold bg-gradient-to-r from-primary to-info text-primary-foreground inline-flex items-center justify-center gap-2 shadow-[var(--shadow-glow)]"
              >
                <ShieldCheck className="h-4 w-4" /> Acknowledge Alert
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  value,
  mono,
  accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg bg-accent/40 border border-border px-3 py-2">
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </dt>
      <dd
        className={`mt-0.5 text-sm font-semibold ${mono ? "font-mono" : ""} ${accent ? "text-danger" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
