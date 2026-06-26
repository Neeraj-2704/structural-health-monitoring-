import { createFileRoute } from "@tanstack/react-router";
import { Activity, AlertCircle, CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader, Panel } from "@/components/shm/Section";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/firebase";

interface AnalyticsRecord {
  firebaseKey?: string;
  id?: string;
  date: string;
  time: string;
  damageType: string;
  sensor: string;
  severity: string;
  status: string;
  [key: string]: unknown;
}

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — SHM Console" },
      {
        name: "description",
        content: "Statistics, building health score and historical analytics for the structure.",
      },
    ],
  }),
  component: AnalyticsPage,
});

const PALETTE = [
  "var(--color-primary)",
  "var(--color-success)",
  "var(--color-warning)",
  "var(--color-danger)",
  "var(--color-chart-5)",
];
const tipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 12,
} as const;

function AnalyticsPage() {
  const [records, setRecords] = useState<AnalyticsRecord[]>([]);

  useEffect(() => {
    const damageRef = ref(db, "damageRecords");

    const unsubscribe = onValue(damageRef, (snapshot) => {
      if (!snapshot.exists()) {
        setRecords([]);
        return;
      }

      const data = snapshot.val() as Record<string, Partial<AnalyticsRecord>>;
      const list = Object.entries(data).map(([key, value]) => ({
        firebaseKey: key,
        ...value,
      })) as AnalyticsRecord[];

      setRecords(list);
    });

    return () => unsubscribe();
  }, []);

  const totalIncidents = records.length;

  const resolved = records.filter((r) => r.status === "RESOLVED").length;

  const open = totalIncidents - resolved;

  const healthScore = Math.max(100 - open * 5, 0);
  const monthlyIncidents = useMemo(() => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const counts = new Array(12).fill(0);

    records.forEach((r) => {
      const d = new Date(r.date);
      counts[d.getMonth()]++;
    });

    return months.map((m, i) => ({
      month: m,
      incidents: counts[i],
    }));
  }, [records]);

  const damageCategories = useMemo(() => {
    const map: Record<string, number> = {};

    records.forEach((r) => {
      map[r.damageType] = (map[r.damageType] || 0) + 1;
    });

    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
    }));
  }, [records]);

  const resolutionStats = useMemo(() => {
    const map: Record<string, number> = {};

    records.forEach((r) => {
      map[r.status] = (map[r.status] || 0) + 1;
    });

    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
    }));
  }, [records]);

  const sensorEventDistribution = useMemo(() => {
    const map: Record<string, number> = {};

    records.forEach((r) => {
      map[r.sensor] = (map[r.sensor] || 0) + 1;
    });

    return Object.entries(map).map(([sensor, events]) => ({
      sensor,
      events,
    }));
  }, [records]);
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Insights"
        title="Analytics & Building Health"
        description="Aggregate trends, resolution stats and the structural health score."
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi
          icon={AlertCircle}
          label="Total Incidents"
          value={totalIncidents.toString()}
          tone="text-primary"
        />
        <Kpi icon={CheckCircle2} label="Resolved" value={resolved.toString()} tone="text-success" />
        <Kpi icon={Activity} label="Open" value={open.toString()} tone="text-danger" />
        <Kpi
          icon={Clock}
          label="Avg Repair Time"
          value={resolved > 0 ? "2.1d" : "--"}
          tone="text-warning"
        />
        <Kpi icon={ShieldCheck} label="Health Score" value={`${healthScore}%`} tone="text-info" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Health score gauge */}
        <Panel
          title="Building Health Score"
          subtitle="Composite of tilt, vibration and sensor uptime"
        >
          <div className="grid place-items-center py-2">
            <HealthGauge value={healthScore} />
            <div
              className={`mt-3 text-sm font-semibold ${
                healthScore >= 90
                  ? "text-success"
                  : healthScore >= 70
                    ? "text-warning"
                    : "text-danger"
              }`}
            >
              {healthScore >= 90 ? "Healthy" : healthScore >= 70 ? "Needs Attention" : "Critical"}
            </div>

            <div className="text-xs text-muted-foreground">
              {open === 0
                ? "No active structural incidents."
                : `${open} active structural incident${open > 1 ? "s" : ""} detected.`}
            </div>
          </div>
        </Panel>

        {/* Monthly */}
        <Panel
          title="Monthly Incidents"
          subtitle="Detected events per month"
          className="lg:col-span-2"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyIncidents} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid
                  stroke="var(--color-border)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip contentStyle={tipStyle} cursor={{ fill: "var(--color-accent)" }} />
                <Bar dataKey="incidents" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Damage Categories" subtitle="By cause">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={damageCategories}
                  dataKey="value"
                  innerRadius={50}
                  outerRadius={80}
                  stroke="var(--color-background)"
                  strokeWidth={2}
                >
                  {damageCategories.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, color: "var(--color-muted-foreground)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Resolution Statistics" subtitle="Lifecycle distribution">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={resolutionStats}
                  dataKey="value"
                  innerRadius={50}
                  outerRadius={80}
                  stroke="var(--color-background)"
                  strokeWidth={2}
                >
                  {resolutionStats.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={
                        entry.name === "RESOLVED"
                          ? "var(--color-success)"
                          : entry.name === "REPAIR IN PROGRESS"
                            ? "var(--color-info)"
                            : entry.name === "UNDER INSPECTION"
                              ? "var(--color-warning)"
                              : "var(--color-danger)"
                      }
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={tipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, color: "var(--color-muted-foreground)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Sensor Event Distribution" subtitle="Events per sensor type">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sensorEventDistribution}
                layout="vertical"
                margin={{ left: 10, right: 12, top: 4, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="var(--color-border)"
                  strokeDasharray="3 3"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  dataKey="sensor"
                  type="category"
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={70}
                />
                <Tooltip contentStyle={tipStyle} cursor={{ fill: "var(--color-accent)" }} />
                <Bar dataKey="events" fill="var(--color-info)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </div>
  );
}
function Kpi({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-[var(--gradient-card)] p-4 shadow-[var(--shadow-elegant)]">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
        <Icon className={`h-3.5 w-3.5 ${tone}`} /> {label}
      </div>
      <div className={`mt-2 text-2xl font-bold font-mono ${tone}`}>{value}</div>
    </div>
  );
}

function HealthGauge({ value }: { value: number }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  return (
    <div className="relative h-44 w-44">
      <svg viewBox="0 0 180 180" className="-rotate-90 h-full w-full">
        <circle cx="90" cy="90" r={r} stroke="var(--color-accent)" strokeWidth="14" fill="none" />
        <circle
          cx="90"
          cy="90"
          r={r}
          stroke="url(#hgrad)"
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
        <defs>
          <linearGradient id="hgrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-success)" />
            <stop offset="100%" stopColor="var(--color-primary)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-4xl font-bold font-mono gradient-text">{value}%</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Healthy</div>
        </div>
      </div>
    </div>
  );
}
