import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, ClipboardEdit, UserCog, Wrench } from "lucide-react";
import { PageHeader, Panel } from "@/components/shm/Section";
import type { IncidentStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { ref, onValue, update, remove } from "firebase/database";
import { db } from "@/firebase";

interface MaintenanceRecord {
  firebaseKey: string;
  id: string;
  damageType: string;
  description: string;
  date: string;
  time: string;
  assignedEngineer: string;
  status: IncidentStatus;
  repairCompletionDate: string | null;
  engineerNotes: string;
  [key: string]: unknown;
}

export const Route = createFileRoute("/maintenance")({
  head: () => ({
    meta: [
      { title: "Maintenance & Repair — SHM Console" },
      {
        name: "description",
        content: "Manage repair workflow, assigned engineers and incident notes.",
      },
    ],
  }),
  component: MaintenancePage,
});

const STATUSES: IncidentStatus[] = ["OPEN", "UNDER INSPECTION", "REPAIR IN PROGRESS", "RESOLVED"];

function MaintenancePage() {
  const [list, setList] = useState<MaintenanceRecord[]>([]);
  useEffect(() => {
    const maintenanceRef = ref(db, "maintenanceRecords");

    const unsubscribe = onValue(maintenanceRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();

        const records = Object.keys(data).map((key) => ({
          firebaseKey: key,
          ...data[key],
        }));

        setList(records);
      } else {
        setList([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const setStatus = async (firebaseKey: string, status: IncidentStatus) => {
    // Update Damage Records status
    await update(ref(db, `damageRecords/${firebaseKey}`), {
      status,
      repairCompletionDate: status === "RESOLVED" ? new Date().toISOString().slice(0, 10) : null,
    });

    if (status === "RESOLVED") {
      // Remove from Maintenance page
      await remove(ref(db, `maintenanceRecords/${firebaseKey}`));
    } else {
      // Update Maintenance page
      await update(ref(db, `maintenanceRecords/${firebaseKey}`), {
        status,
        repairCompletionDate: null,
      });
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Workflow"
        title="Maintenance & Repair"
        description="Track inspection, repair progress and engineer assignments per incident."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {list.map((i) => (
          <Panel key={i.id} className="flex flex-col">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-start">
              <div className="min-w-0">
                <div className="text-[11px] font-mono text-primary">{i.id}</div>
                <h3 className="text-base font-semibold truncate">{i.damageType}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{i.description}</p>
              </div>
              <StatusBadge status={i.status} />
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <Meta icon={ClipboardEdit} label="Detected" value={`${i.date}  ${i.time}`} />
              <Meta icon={UserCog} label="Assigned" value={i.assignedEngineer} />
              <Meta icon={Wrench} label="Repair status" value={i.status} />
              <Meta icon={CheckCircle2} label="Completed" value={i.repairCompletionDate ?? "—"} />
            </dl>

            <div className="mt-3 rounded-md bg-accent/40 border border-border px-3 py-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Engineer notes:</span>{" "}
              {i.engineerNotes}
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(i.firebaseKey, s)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider border transition-colors",
                    i.status === s
                      ? "bg-primary/15 text-primary border-primary/40"
                      : "bg-accent/30 text-muted-foreground border-border hover:text-foreground hover:bg-accent",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-md bg-accent/30 px-2.5 py-2 border border-border/60">
      <Icon className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-xs font-medium truncate">{value}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: IncidentStatus }) {
  const map: Record<IncidentStatus, string> = {
    OPEN: "bg-danger/15 text-danger border-danger/30",
    "UNDER INSPECTION": "bg-warning/15 text-warning border-warning/30",
    "REPAIR IN PROGRESS": "bg-info/15 text-info border-info/30",
    RESOLVED: "bg-success/15 text-success border-success/30",
  };
  return (
    <span
      className={cn(
        "shrink-0 inline-flex px-2 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-wider",
        map[status],
      )}
    >
      {status}
    </span>
  );
}
