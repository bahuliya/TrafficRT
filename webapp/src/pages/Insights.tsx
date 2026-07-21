import { BarChart3, Loader2, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  HazardBreakdownChart,
  InsightStatCards,
  SeverityDonut,
} from "@/components/insights";
import { useInsights } from "@/hooks/useInsights";

export default function Insights() {
  const { data, isLoading, isError, error, refetch, isFetching } = useInsights();

  return (
    <div className="min-h-screen bg-background py-6 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/20 rounded-xl">
              <BarChart3 className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Insights</h1>
              <p className="text-muted-foreground text-sm">
                Live analytics across camera hazards and community reports
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="border-border/50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </header>

        {isLoading && (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Crunching the latest numbers...
          </div>
        )}

        {isError && (
          <Alert variant="destructive">
            <AlertTitle>Failed to load insights</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Please try refreshing."}
            </AlertDescription>
          </Alert>
        )}

        {data && (
          <>
            <InsightStatCards summary={data.summary} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <HazardBreakdownChart
                title="Camera Hazards by Type"
                data={data.hazardsByType}
                emptyLabel="No active camera hazards"
              />
              <SeverityDonut data={data.severityDistribution} />
            </div>

            <HazardBreakdownChart
              title="Community Reports by Type"
              data={data.reportsByType}
              barColor="#14b8a6"
              emptyLabel="No open community reports yet"
            />

            <p className="text-center text-xs text-muted-foreground/60">
              Updated {new Date(data.summary.generatedAt).toLocaleTimeString()}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
