import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SeverityBucket, SeverityDistribution } from "../../../../backend/src/types";

const BUCKET_META: Record<SeverityBucket, { label: string; color: string }> = {
  clear: { label: "Clear", color: "#10b981" },
  minor: { label: "Minor (1-3)", color: "#eab308" },
  moderate: { label: "Moderate (4-6)", color: "#f59e0b" },
  severe: { label: "Severe (7-10)", color: "#ef4444" },
};

export function SeverityDonut({ data }: { data: SeverityDistribution[] }) {
  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({
      name: BUCKET_META[d.bucket].label,
      value: d.count,
      color: BUCKET_META[d.bucket].color,
    }));

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">Severity Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
            No active hazards right now
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                stroke="none"
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "rgba(17,24,28,0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  color: "#e5e7eb",
                }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
