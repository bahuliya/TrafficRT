import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  CreateSavedRouteRequest,
  SavedRoute,
} from "../../../backend/src/types";

const SAVED_ROUTES_KEY = ["saved-routes"];

export function useSavedRoutes() {
  return useQuery({
    queryKey: SAVED_ROUTES_KEY,
    queryFn: () => api.get<SavedRoute[]>("/api/saved-routes"),
    staleTime: 30000,
  });
}

export function useCreateSavedRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSavedRouteRequest) =>
      api.post<SavedRoute>("/api/saved-routes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAVED_ROUTES_KEY });
    },
  });
}

export function useDeleteSavedRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<SavedRoute>(`/api/saved-routes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SAVED_ROUTES_KEY });
    },
  });
}
