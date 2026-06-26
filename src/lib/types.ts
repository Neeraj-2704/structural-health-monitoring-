export interface DamageRecord {
  id: string;
  date: string;
  time: string;
  severity: "WARNING" | "DANGER";
  sensor: string;
  value: number;
  damageType: string;
  status: "OPEN";
}

export interface MaintenanceRecord {
  id: string;
  damageId: string;
  date: string;
  time: string;
  severity: "DANGER";
  sensor: string;
  value: number;
  engineer: string;
  status: "OPEN" | "UNDER INSPECTION" | "REPAIR IN PROGRESS" | "RESOLVED";
}
