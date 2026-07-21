import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CategoryCount } from "../../../../backend/src/types";

interface HazardBreakdownChartProps {
  title: string;
  data: CategoryCount[];
  barColor?: string;
  emptyLabel?: string;
}

function severityColor(avgSeverity: number, fallback: string): string {
  if (avgSeverity >= 7) return "#ef4444";
  if (avgSeverity >= 4) return "#f59e0b";
  if (avgSeverity > 0) return "#eab308";
  return fallback;
}

export function HazardBreakdownChart({
  title,
  data,
  barColor = "#10b981",
  emptyLabel = "No data available",
}: HazardBreakdownChartProps) {
  return (
    <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
            {emptyLabel}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis type="number" allowDecimals={false} stroke="rgba(255,255,255,0.4)" fontSize={12} />
              <YAxis
                type="category"
                dataKey="label"
                width={110}
                stroke="rgba(255,255,255,0.6)"
                fontSize={12}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                contentStyle={{
                  background: "rgba(17,24,28,0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  color: "#e5e7eb",
                }}
                formatter={(value: number, _name, item) => [
                  `${value} (avg severity ${item.payload.avgSeverity}/10)`,
                  "Count",
                ]}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
                {data.map((entry) => (
                  <Cell key={entry.label} fill={severityColor(entry.avgSeverity, barColor)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
