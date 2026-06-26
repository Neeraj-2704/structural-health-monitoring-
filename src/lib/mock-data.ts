// Mock data generator for SHM dashboard.
// All values are realistic dummy data designed to be replaced by ESP32 sensor feeds.

export type SystemStatus = "SAFE" | "WARNING" | "DANGER";
export type IncidentStatus = "OPEN" | "UNDER INSPECTION" | "REPAIR IN PROGRESS" | "RESOLVED";
export type Severity = "SAFE" | "WARNING" | "DANGER";

export interface SensorReading {
  time: string;
  temperature: number;
  humidity: number;
  tiltX: number;
  tiltY: number;
  tiltZ: number;
  vibration: number;
}

export interface Incident {
  id: string;
  date: string;
  time: string;
  damageType: string;
  sensor: string;
  severity: Severity;
  status: IncidentStatus;
  description: string;
  assignedEngineer: string;
  repairCompletionDate: string | null;
  engineerNotes: string;
}

export interface Alert {
  id: string;
  title: string;
  time: string;
  sensor: string;
  reading: string;
  severity: Severity;
  acknowledged: boolean;
}

const rand = (min: number, max: number) => +(Math.random() * (max - min) + min).toFixed(2);

export function generateLiveReadings(points = 24): SensorReading[] {
  const now = Date.now();
  return Array.from({ length: points }).map((_, i) => {
    const t = new Date(now - (points - 1 - i) * 60_000);
    return {
      time: t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      temperature: rand(24, 31),
      humidity: rand(45, 65),
      tiltX: rand(-0.6, 0.6),
      tiltY: rand(-0.5, 0.5),
      tiltZ: rand(-0.3, 0.3),
      vibration: rand(0.05, 0.45),
    };
  });
}

export const incidents: Incident[] = [
  {
    id: "INC-2041",
    date: "2026-06-08",
    time: "14:32",
    damageType: "Excessive Tilt (X-axis)",
    sensor: "MPU6050 — Floor 7",
    severity: "DANGER",
    status: "REPAIR IN PROGRESS",
    description: "Tilt threshold exceeded on west column after lateral load event.",
    assignedEngineer: "Eng. R. Mehta",
    repairCompletionDate: null,
    engineerNotes: "Steel bracing reinforcement scheduled. Awaiting parts delivery.",
  },
  {
    id: "INC-2038",
    date: "2026-06-05",
    time: "09:11",
    damageType: "High Vibration Anomaly",
    sensor: "Vibration — Basement",
    severity: "WARNING",
    status: "UNDER INSPECTION",
    description: "Repeated vibration spikes during HVAC cycles.",
    assignedEngineer: "Eng. S. Patel",
    repairCompletionDate: null,
    engineerNotes: "Suspect loose mounting on chiller unit. Manual inspection in progress.",
  },
  {
    id: "INC-2035",
    date: "2026-05-29",
    time: "22:47",
    damageType: "Humidity Threshold Breach",
    sensor: "DHT22 — Floor 3",
    severity: "WARNING",
    status: "RESOLVED",
    description: "Sustained humidity > 78% in service corridor.",
    assignedEngineer: "Eng. A. Khan",
    repairCompletionDate: "2026-06-01",
    engineerNotes: "Sealed pipe leak. Dehumidifier installed as precaution.",
  },
  {
    id: "INC-2032",
    date: "2026-05-21",
    time: "11:02",
    damageType: "Micro-crack Vibration Signature",
    sensor: "Vibration — Floor 4",
    severity: "DANGER",
    status: "RESOLVED",
    description: "Frequency signature matched concrete micro-fracture profile.",
    assignedEngineer: "Eng. R. Mehta",
    repairCompletionDate: "2026-05-25",
    engineerNotes: "Epoxy resin injection completed. Re-tested OK.",
  },
  {
    id: "INC-2029",
    date: "2026-05-14",
    time: "06:38",
    damageType: "Tilt Drift (Y-axis)",
    sensor: "MPU6050 — Roof",
    severity: "WARNING",
    status: "RESOLVED",
    description: "Slow drift on rooftop sensor over 72h window.",
    assignedEngineer: "Eng. S. Patel",
    repairCompletionDate: "2026-05-18",
    engineerNotes: "Sensor recalibration; baseline restored.",
  },
  {
    id: "INC-2026",
    date: "2026-05-02",
    time: "17:24",
    damageType: "Temperature Spike",
    sensor: "DHT22 — Floor 5",
    severity: "WARNING",
    status: "OPEN",
    description: "Localized temperature anomaly near electrical riser.",
    assignedEngineer: "Eng. A. Khan",
    repairCompletionDate: null,
    engineerNotes: "Electrical team notified. Awaiting thermography report.",
  },
  {
    id: "INC-2023",
    date: "2026-04-22",
    time: "13:55",
    damageType: "Vibration Burst",
    sensor: "Vibration — Floor 2",
    severity: "DANGER",
    status: "RESOLVED",
    description: "Short-duration high-amplitude vibration event.",
    assignedEngineer: "Eng. R. Mehta",
    repairCompletionDate: "2026-04-29",
    engineerNotes: "Identified as construction work in adjacent lot. Monitoring continued.",
  },
  {
    id: "INC-2019",
    date: "2026-04-09",
    time: "08:17",
    damageType: "Combined Tilt + Vibration",
    sensor: "MPU6050 — Floor 6",
    severity: "DANGER",
    status: "RESOLVED",
    description: "Composite event indicating possible joint fatigue.",
    assignedEngineer: "Eng. S. Patel",
    repairCompletionDate: "2026-04-19",
    engineerNotes: "Joint plate replaced. Bolts re-torqued to spec.",
  },
];

export const initialAlerts: Alert[] = [
  {
    id: "ALT-7781",
    title: "Excessive Tilt Detected",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    sensor: "MPU6050 — Floor 7",
    reading: "Tilt X = 2.41°  (threshold 1.5°)",
    severity: "DANGER",
    acknowledged: false,
  },
];

export const monthlyIncidents = [
  { month: "Jan", incidents: 4 },
  { month: "Feb", incidents: 6 },
  { month: "Mar", incidents: 3 },
  { month: "Apr", incidents: 7 },
  { month: "May", incidents: 5 },
  { month: "Jun", incidents: 2 },
];

export const damageCategories = [
  { name: "Tilt", value: 38 },
  { name: "Vibration", value: 27 },
  { name: "Humidity", value: 18 },
  { name: "Temperature", value: 11 },
  { name: "Composite", value: 6 },
];

export const resolutionStats = [
  { name: "Resolved", value: 21 },
  { name: "In Progress", value: 4 },
  { name: "Open", value: 2 },
];

export const sensorEventDistribution = [
  { sensor: "MPU6050", events: 42 },
  { sensor: "DHT22", events: 29 },
  { sensor: "Vibration", events: 35 },
  { sensor: "Strain", events: 14 },
];

export const timelineEvents = [
  {
    stage: "Damage Detected",
    time: "2026-06-08  14:32",
    detail: "Tilt X exceeded threshold on Floor 7 column.",
    status: "done",
  },
  {
    stage: "Alert Generated",
    time: "2026-06-08  14:32",
    detail: "DANGER alert ALT-7781 dispatched to on-call engineer.",
    status: "done",
  },
  {
    stage: "Inspection Performed",
    time: "2026-06-08  16:10",
    detail: "Eng. R. Mehta confirmed structural deviation visually.",
    status: "done",
  },
  {
    stage: "Repair Initiated",
    time: "2026-06-09  08:00",
    detail: "Steel bracing reinforcement work order opened.",
    status: "active",
  },
  {
    stage: "Repair Completed",
    time: "Pending",
    detail: "Awaiting parts delivery. ETA 2026-06-13.",
    status: "pending",
  },
  {
    stage: "System Returned to Safe",
    time: "Pending",
    detail: "Re-test and recalibrate sensors post-repair.",
    status: "pending",
  },
];
