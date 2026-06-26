import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Filter, Search } from "lucide-react";
import { PageHeader, Panel } from "@/components/shm/Section";
import { StatusPill } from "@/components/shm/AppShell";
import type { IncidentStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { ref, onValue } from "firebase/database";
import { db } from "@/firebase";

interface IncidentRecord {
  id: string;
  date: string;
  time: string;
  damageType: string;
  sensor: string;
  severity: string;
  status: IncidentStatus;
  [key: string]: unknown;
}

export const Route = createFileRoute("/incidents")({
  head: () => ({
    meta: [
      { title: "Damage Incident Records — SHM Console" },
      {
        name: "description",
        content: "Historical record of structural incidents with search, filter and sort.",
      },
    ],
  }),
  component: IncidentsPage,
});

const STATUSES: ("ALL" | IncidentStatus)[] = [
  "ALL",
  "OPEN",
  "UNDER INSPECTION",
  "REPAIR IN PROGRESS",
  "RESOLVED",
];

function IncidentsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("ALL");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  type Severity = "SAFE" | "WARNING" | "DANGER";

  interface Incident {
    id: string;
    date: string;
    time: string;
    damageType: string;
    sensor: string;
    severity: Severity;
    status: IncidentStatus;
  }
  const [incidentsData, setIncidentsData] = useState<Incident[]>([]);

  useEffect(() => {
    const incidentsRef = ref(db, "damageRecords");

    const unsubscribe = onValue(incidentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();

        const records = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));

        setIncidentsData(records);
      } else {
        setIncidentsData([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const rows = useMemo(() => {
    let r = [...incidentsData];
    if (status !== "ALL") r = r.filter((i) => i.status === status);
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter(
        (i) =>
          i.id.toLowerCase().includes(q) ||
          i.damageType.toLowerCase().includes(q) ||
          i.sensor.toLowerCase().includes(q),
      );
    }
    r.sort((a, b) =>
      sortDir === "desc" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date),
    );
    return r;
  }, [incidentsData, query, status, sortDir]);

  const statusClass: Record<IncidentStatus, string> = {
    OPEN: "bg-danger/15 text-danger border-danger/30",
    "UNDER INSPECTION": "bg-warning/15 text-warning border-warning/30",
    "REPAIR IN PROGRESS": "bg-info/15 text-info border-info/30",
    RESOLVED: "bg-success/15 text-success border-success/30",
  };
  const sortedRows = [...rows].sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.time}`).getTime();
    const dateB = new Date(`${b.date} ${b.time}`).getTime();

    return dateB - dateA;
  });
  return (
    <div>
      <PageHeader
        eyebrow="History"
        title="Damage Incident Records"
        description="Searchable archive of all detected structural events."
      />

      <Panel>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 mb-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by ID, damage type, sensor…"
              className="w-full bg-accent/40 border border-border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as IncidentStatus | "ALL")}
              className="bg-accent/40 border border-border rounded-md px-3 py-2 text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
            className="inline-flex items-center gap-2 bg-accent/40 border border-border rounded-md px-3 py-2 text-sm hover:bg-accent"
          >
            <ArrowUpDown className="h-4 w-4" /> Date {sortDir === "desc" ? "↓" : "↑"}
          </button>
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="py-2.5 px-3">Incident ID</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Damage Type</th>
                <th className="py-2.5 px-3">Sensor</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((i, index) => (
                <tr
                  key={`DR${String(index + 1).padStart(3, "0")}`}
                  className="border-b border-border/60 hover:bg-accent/30 transition-colors"
                >
                  <td className="py-3 px-3 font-mono text-primary">{`DR${String(index + 1).padStart(3, "0")}`}</td>
                  <td className="py-3 px-3 font-mono text-muted-foreground">{i.date}</td>
                  <td className="py-3 px-3 font-mono text-muted-foreground">{i.time}</td>
                  <td className="py-3 px-3 font-medium">{i.damageType}</td>
                  <td className="py-3 px-3 text-muted-foreground">{i.sensor}</td>
                  <td className="py-3 px-3">
                    <StatusPill status={i.severity} />
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={cn(
                        "inline-flex px-2 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-wider",
                        statusClass[i.status as IncidentStatus],
                      )}
                    >
                      {i.status}
                    </span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-muted-foreground text-sm">
                    No damage incidents recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
