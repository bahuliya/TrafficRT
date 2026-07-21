import { Activity, AlertTriangle, Camera, MapPin, ShieldCheck, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { InsightsSummary } from "../../../../backend/src/types";

interface StatCardProps {
  icon: typeof Activity;
  label: string;
  value: string | number;
  hint?: string;
  accent: string;
}

function StatCard({ icon: Icon, label, value, hint, accent }: StatCardProps) {
  return (
    <Card className="bg-card/50 border-border/50 backdrop-blur-sm p-4 flex items-start gap-3">
      <div className={cn("flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0", accent)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-foreground leading-tight">{value}</p>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {hint ? <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5">{hint}</p> : null}
      </div>
    </Card>
  );
}

export function InsightStatCards({ summary }: { summary: InsightsSummary }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      <StatCard
        icon={Camera}
        label="Cameras Monitored"
        value={summary.totalCameras}
        accent="bg-blue-500/15 text-blue-400"
      />
      <StatCard
        icon={AlertTriangle}
        label="Active Hazards"
        value={summary.activeHazards}
        accent="bg-amber-500/15 text-amber-400"
      />
      <StatCard
        icon={ShieldCheck}
        label="Clear Cameras"
        value={summary.clearCameras}
        accent="bg-emerald-500/15 text-emerald-400"
      />
      <StatCard
        icon={Users}
        label="Community Reports"
        value={summary.communityReports}
        hint={`${summary.verifiedReports} AI-verified`}
        accent="bg-teal-500/15 text-teal-400"
      />
      <StatCard
        icon={Activity}
        label="Avg Severity"
        value={`${summary.avgHazardSeverity}/10`}
        accent="bg-red-500/15 text-red-400"
      />
      <StatCard
        icon={MapPin}
        label="Top Hotspot"
        value={summary.hotspotLocation ? "1" : "0"}
        hint={summary.hotspotLocation ?? "No active hotspots"}
        accent="bg-purple-500/15 text-purple-400"
      />
    </div>
  );
}
