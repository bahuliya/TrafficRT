import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { InsightsResponse } from "../../../backend/src/types";

export function useInsights() {
  return useQuery({
    queryKey: ["insights"],
    queryFn: () => api.get<InsightsResponse>("/api/insights"),
    refetchInterval: 60000, // Refresh aggregates every minute
    staleTime: 30000,
  });
}
