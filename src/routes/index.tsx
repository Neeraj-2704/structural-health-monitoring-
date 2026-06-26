import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Droplets, Move3d, RotateCw, ThermometerSun, Waves } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader, Panel } from "@/components/shm/Section";
import { SensorCard } from "@/components/shm/SensorCard";
import { AlertBanner, AlertModal } from "@/components/shm/AlertBanner";
import {
  generateLiveReadings,
  initialAlerts,
  type Alert,
  type SensorReading,
} from "@/lib/mock-data";
import { ref, onValue, push, set, get, update } from "firebase/database";
import { db } from "@/firebase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Live Dashboard — SHM Console" },
      {
        name: "description",
        content: "Real-time structural sensor telemetry, system status, and active alerts.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const [data, setData] = useState<SensorReading[]>(generateLiveReadings(1));
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertStatus, setAlertStatus] = useState("SAFE");
  const [previousStatus, setPreviousStatus] = useState("SAFE");

  const [currentSeverity, setCurrentSeverity] = useState<"SAFE" | "WARNING" | "DANGER">("SAFE");
  const previousSystemStatus = useRef<"SAFE" | "WARNING" | "DANGER">("SAFE");
  const [maintenanceCreated, setMaintenanceCreated] = useState(false);
  const [modalAlert, setModalAlert] = useState<Alert | null>(initialAlerts[0] ?? null);
  const [modalOpen, setModalOpen] = useState(false);
  const incidentCreated = useRef(false);
  const [activeAlerts, setActiveAlerts] = useState(0);
  const activeIncidentKey = useRef<string | null>(null);
  const creatingIncident = useRef(false);

  useEffect(() => {
    const sensorRef = ref(db, "sensorData");
    const unsubscribe = onValue(sensorRef, async (snapshot) => {
      const sensor = snapshot.val();

      if (!sensor) {
        return;
      }

      setAlertStatus(sensor.alertStatus || "SAFE");
      const currentStatus =
        sensor.temperature > 45 ||
        sensor.humidity > 85 ||
        Math.abs(sensor.tiltX) > 0.4 ||
        Math.abs(sensor.tiltY) > 0.4 ||
        sensor.vibration > 2
          ? "DANGER"
          : sensor.temperature > 35 ||
              sensor.humidity > 70 ||
              Math.abs(sensor.tiltX) > 0.2 ||
              Math.abs(sensor.tiltY) > 0.2 ||
              sensor.vibration > 1
            ? "WARNING"
            : "SAFE";
      const damageType =
        Math.abs(sensor.tiltX) > 0.2 || Math.abs(sensor.tiltY) > 0.2
          ? "High Tilt"
          : sensor.temperature > 35
            ? "High Temperature"
            : sensor.humidity > 70
              ? "High Humidity"
              : sensor.vibration > 1
                ? "High Vibration"
                : "Structural Anomaly";

      const sensorName = sensor.temperature > 35 || sensor.humidity > 70 ? "DHT22" : "MPU6050";
      if (
        previousSystemStatus.current === "SAFE" &&
        (currentStatus === "WARNING" || currentStatus === "DANGER") &&
        !creatingIncident.current
      ) {
        creatingIncident.current = true;

        const damageRoot = ref(db, "damageRecords");

        // Get current number of records
        const snapshot = await get(damageRoot);

        const nextNumber = snapshot.exists() ? Object.keys(snapshot.val()).length + 1 : 1;

        const displayId = `DR${String(nextNumber).padStart(3, "0")}`;

        const damageRef = push(damageRoot);

        const record = {
          id: displayId,
          date: new Date().toISOString().slice(0, 10),
          time: new Date().toLocaleTimeString(),
          damageType,
          sensor: sensorName,
          severity: currentStatus,
          status: "OPEN",
        };

        await set(damageRef, record);

        const maintenanceRef = ref(db, `maintenanceRecords/${damageRef.key}`);

        await set(maintenanceRef, record);
        activeIncidentKey.current = damageRef.key;
        previousSystemStatus.current = currentStatus;
        creatingIncident.current = false;
      }
      if (
        activeIncidentKey.current &&
        previousSystemStatus.current !== "SAFE" &&
        currentStatus !== "SAFE"
      ) {
        await update(ref(db, `damageRecords/${activeIncidentKey.current}`), {
          severity: currentStatus,
          damageType,
          sensor: sensorName,
        });
        await update(ref(db, `maintenanceRecords/${activeIncidentKey.current}`), {
          severity: currentStatus,
          damageType,
          sensor: sensorName,
        });
      }
      if (currentStatus === "SAFE") {
        activeIncidentKey.current = null;
        creatingIncident.current = false;
      }

      previousSystemStatus.current = currentStatus;

      if (
        previousSystemStatus.current === "WARNING" &&
        currentStatus === "DANGER" &&
        activeIncidentKey.current
      ) {
        await update(ref(db, `damageRecords/${activeIncidentKey.current}`), {
          severity: "DANGER",
        });

        await update(ref(db, `maintenanceRecords/${activeIncidentKey.current}`), {
          severity: "DANGER",
        });
      }
      setData((prev) => {
        const newPoint: SensorReading = {
          time: new Date().toLocaleTimeString(),
          temperature: sensor.temperature,
          humidity: sensor.humidity,
          tiltX: sensor.tiltX,
          tiltY: sensor.tiltY,
          tiltZ: 0,
          vibration: sensor.vibration,
        };

        return [...prev.slice(-19), newPoint];
      });
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const maintenanceRef = ref(db, "maintenanceRecords");

    const unsubscribe = onValue(maintenanceRef, (snapshot) => {
      if (!snapshot.exists()) {
        setActiveAlerts(0);
        return;
      }

      const data = snapshot.val();

      const count = Object.values(data as Record<string, { status?: string }>).filter(
        (record) => record.status !== "RESOLVED",
      ).length;

      setActiveAlerts(count);
    });

    return () => unsubscribe();
  }, []);

  const latest = useMemo(
    () =>
      data[data.length - 1] ?? {
        time: "Now",
        temperature: 0,
        humidity: 0,
        tiltX: 0,
        tiltY: 0,
        tiltZ: 0,
        vibration: 0,
      },
    [data],
  );

  const systemStatus: "SAFE" | "WARNING" | "DANGER" =
    latest.temperature > 45 ||
    latest.humidity > 85 ||
    Math.abs(latest.tiltX) > 0.4 ||
    Math.abs(latest.tiltY) > 0.4 ||
    latest.vibration > 2
      ? "DANGER"
      : latest.temperature > 35 ||
          latest.humidity > 70 ||
          Math.abs(latest.tiltX) > 0.2 ||
          Math.abs(latest.tiltY) > 0.2 ||
          latest.vibration > 1
        ? "WARNING"
        : "SAFE";
  useEffect(() => {
    if (previousSystemStatus.current === systemStatus) {
      return;
    }

    previousSystemStatus.current = systemStatus;
  }, [systemStatus]);
  type SensorStatus = "SAFE" | "WARNING" | "DANGER";
  const sensorList = useMemo(
    () => [
      {
        icon: ThermometerSun,
        label: "Temperature",
        value: latest.temperature.toFixed(1),
        unit: "°C",
        status:
          latest.temperature > 45
            ? "DANGER"
            : latest.temperature > 35
              ? "WARNING"
              : ("SAFE" as SensorStatus),
        trend: data.map((d) => d.temperature),
      },
      {
        icon: Droplets,
        label: "Humidity",
        value: latest.humidity.toFixed(0),
        unit: "%",
        status:
          latest.humidity > 85
            ? "DANGER"
            : latest.humidity > 70
              ? "WARNING"
              : ("SAFE" as SensorStatus),
        trend: data.map((d) => d.humidity),
      },
      {
        icon: Move3d,
        label: "Tilt X",
        value: latest.tiltX.toFixed(2),
        unit: "°",
        status:
          Math.abs(latest.tiltX) > 0.4
            ? "DANGER"
            : Math.abs(latest.tiltX) > 0.2
              ? "WARNING"
              : ("SAFE" as SensorStatus),
        trend: data.map((d) => d.tiltX),
      },
      {
        icon: RotateCw,
        label: "Tilt Y",
        value: latest.tiltY.toFixed(2),
        unit: "°",
        status:
          Math.abs(latest.tiltY) > 0.4
            ? "DANGER"
            : Math.abs(latest.tiltY) > 0.2
              ? "WARNING"
              : ("SAFE" as SensorStatus),
        trend: data.map((d) => d.tiltY),
      },
      {
        icon: Waves,
        label: "Vibration",
        value: latest.vibration.toFixed(2),
        unit: "g",
        status:
          latest.vibration > 2
            ? "DANGER"
            : latest.vibration > 1
              ? "WARNING"
              : ("SAFE" as SensorStatus),
        trend: data.map((d) => d.vibration),
      },
    ],
    [data, latest],
  );

  const acknowledge = () => {
    setAlerts((a) => a.map((x) => ({ ...x, acknowledged: true })));
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Live Telemetry"
        title="Operational Overview"
        description="Aggregate readings from MPU6050, DHT22 and vibration sensors across the structure."
      />

      <AlertBanner active={alertStatus === "DANGER"} />
      {alertStatus === "WARNING" && (
        <div className="rounded-lg border border-yellow-500 bg-yellow-500/10 p-4 text-yellow-500 font-semibold">
          ⚠️ WARNING: Sensor values have crossed warning thresholds.
        </div>
      )}

      {alertStatus === "DANGER" && (
        <div className="rounded-lg border border-red-500 bg-red-500/10 p-4 text-red-500 font-semibold animate-pulse">
          🚨 DANGER: Structural damage suspected. Immediate inspection required.
        </div>
      )}
      {/* Status hero */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatusHero status={systemStatus} />
        <KpiCard
          label="Active Alerts"
          value={activeAlerts.toString()}
          hint="Active maintenance cases"
          tone="danger"
        />
        <KpiCard label="Sensors Online" value="1 / 1" hint="ESP32 Connected" tone="info" />
      </div>

      {/* Sensor grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {sensorList.map((s) => (
          <SensorCard key={s.label} {...s} />
        ))}
      </div>

      {/* Live charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartPanel
          title="Temperature vs Time"
          data={data}
          dataKey="temperature"
          unit="°C"
          color="var(--color-warning)"
        />
        <ChartPanel
          title="Humidity vs Time"
          data={data}
          dataKey="humidity"
          unit="%"
          color="var(--color-info)"
        />
        <ChartPanel title="Tilt vs Time" data={data} multi color="var(--color-primary)" />
        <ChartPanel
          title="Vibration vs Time"
          data={data}
          dataKey="vibration"
          unit="g"
          color="var(--color-danger)"
        />
      </div>

      <AlertModal
        alert={modalAlert}
        open={modalOpen && !!modalAlert}
        onAcknowledge={acknowledge}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

function StatusHero({ status }: { status: "SAFE" | "WARNING" | "DANGER" }) {
  const map = {
    SAFE: {
      label: "All Systems Safe",
      color: "text-success",
      bg: "from-success/20",
      dot: "bg-success",
      ring: "pulse-dot-safe",
      desc: "Structure operating within nominal envelope.",
    },
    WARNING: {
      label: "Warning Threshold",
      color: "text-warning",
      bg: "from-warning/20",
      dot: "bg-warning",
      ring: "",
      desc: "Elevated readings detected. Monitoring closely.",
    },
    DANGER: {
      label: "Critical — Danger",
      color: "text-danger",
      bg: "from-danger/25",
      dot: "bg-danger",
      ring: "pulse-dot-danger",
      desc: "Structural damage suspected. Emergency protocol active.",
    },
  } as const;
  const s = map[status];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative overflow-hidden rounded-xl border border-border bg-gradient-to-br ${s.bg} to-card p-5 shadow-[var(--shadow-elegant)]`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`relative h-14 w-14 rounded-full ${s.dot}/15 grid place-items-center border border-current/30 ${s.color}`}
        >
          <span className={`h-3 w-3 rounded-full ${s.dot} ${s.ring}`} />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-mono">
            System Status
          </div>
          <div className={`text-2xl font-bold ${s.color}`}>{s.label}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{s.desc}</div>
        </div>
      </div>
    </motion.div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: "danger" | "info";
}) {
  const color = tone === "danger" ? "text-danger" : "text-info";
  return (
    <div className="rounded-xl border border-border bg-[var(--gradient-card)] p-5 shadow-[var(--shadow-elegant)]">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-mono">
        {label}
      </div>
      <div className={`mt-2 text-3xl font-bold font-mono ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{hint}</div>
    </div>
  );
}

function ChartPanel({
  title,
  data,
  dataKey,
  unit,
  color,
  multi,
}: {
  title: string;
  data: ReturnType<typeof generateLiveReadings>;
  dataKey?: keyof ReturnType<typeof generateLiveReadings>[number];
  unit?: string;
  color: string;
  multi?: boolean;
}) {
  return (
    <Panel title={title} subtitle={unit ? `Unit: ${unit}` : "Tilt X / Y / Z (°)"}>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          {multi ? (
            <LineChart data={data} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip contentStyle={tipStyle} />
              <Line
                type="monotone"
                dataKey="tiltX"
                stroke="var(--color-primary)"
                dot={false}
                strokeWidth={1.8}
              />
              <Line
                type="monotone"
                dataKey="tiltY"
                stroke="var(--color-success)"
                dot={false}
                strokeWidth={1.8}
              />
              <Line
                type="monotone"
                dataKey="tiltZ"
                stroke="var(--color-warning)"
                dot={false}
                strokeWidth={1.8}
              />
            </LineChart>
          ) : (
            <AreaChart data={data} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id={`fill-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip contentStyle={tipStyle} />
              <Area
                type="monotone"
                dataKey={dataKey as string}
                stroke={color}
                strokeWidth={2}
                fill={`url(#fill-${title})`}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

const tipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--color-foreground)",
} as const;
