import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ClipboardList,
  GaugeCircle,
  LayoutDashboard,
  Menu,
  Network,
  Timer,
  Wrench,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/incidents", label: "Damage Records", icon: ClipboardList },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
] as const;

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [now, setNow] = useState(() => new Date());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl">
        <BrandHeader />
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => (
            <NavItem key={item.to} {...item} active={isActive(pathname, item.to)} />
          ))}
        </nav>
        <SystemPing />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 24, stiffness: 220 }}
              className="absolute left-0 top-0 h-full w-72 bg-sidebar border-r border-sidebar-border flex flex-col"
            >
              <div className="flex items-center justify-between">
                <BrandHeader />
                <button
                  onClick={() => setOpen(false)}
                  className="mr-3 p-2 rounded-md hover:bg-sidebar-accent text-sidebar-foreground"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-1">
                {nav.map((item) => (
                  <NavItem key={item.to} {...item} active={isActive(pathname, item.to)} />
                ))}
              </nav>
              <SystemPing />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 sm:px-6 lg:px-8 h-16">
            <div className="flex min-w-0 items-center gap-3">
              <button
                className="lg:hidden p-2 rounded-md hover:bg-accent text-foreground shrink-0"
                onClick={() => setOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-sm sm:text-base font-semibold">
                  <span className="gradient-text">Structural Health Monitoring</span>
                </h1>
                <p className="hidden sm:block text-[11px] text-muted-foreground font-mono">
                  ESP32 • MPU6050 • DHT22
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full glass">
                <span className="h-2 w-2 rounded-full bg-success pulse-dot-safe" />
                <span className="text-xs font-medium">System Online</span>
              </div>
              <div className="hidden sm:block text-right font-mono">
                <div className="text-sm">{now.toLocaleTimeString()}</div>
                <div className="text-[11px] text-muted-foreground">
                  {now.toLocaleDateString(undefined, {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function isActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname.startsWith(to);
}

function NavItem({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_2px_0_0_var(--color-primary)]"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          active ? "text-primary" : "text-sidebar-foreground/60 group-hover:text-primary",
        )}
      />
      <span className="truncate">{label}</span>
      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary pulse-dot-safe" />}
    </Link>
  );
}

function BrandHeader() {
  return (
    <div className="flex items-center gap-3 px-5 h-16 border-b border-sidebar-border">
      <div className="relative">
        <div className="h-9 w-9 rounded-lg grid place-items-center bg-gradient-to-br from-primary to-info shadow-[var(--shadow-glow)]">
          <GaugeCircle className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>
      <div className="min-w-0">
        <div className="text-sm font-bold leading-tight gradient-text">SHM Console</div>
        <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
          v1.0 • Prototype
        </div>
      </div>
    </div>
  );
}

function SystemPing() {
  return (
    <div className="m-3 p-3 rounded-lg glass">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Activity className="h-3.5 w-3.5 text-success" />
        Telemetry healthy
      </div>
      <div className="mt-1 text-[11px] font-mono text-muted-foreground/80">Last ping: just now</div>
    </div>
  );
}

export function StatusPill({ status }: { status: "SAFE" | "WARNING" | "DANGER" }) {
  const map = {
    SAFE: "bg-success/15 text-success border-success/30",
    WARNING: "bg-warning/15 text-warning border-warning/30",
    DANGER: "bg-danger/15 text-danger border-danger/30",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold tracking-wide",
        map[status],
      )}
    >
      <AlertTriangle className="h-3 w-3" />
      {status}
    </span>
  );
}
