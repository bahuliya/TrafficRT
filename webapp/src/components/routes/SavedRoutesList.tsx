import { ArrowRight, Bookmark, Leaf, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useDeleteSavedRoute, useSavedRoutes } from "@/hooks/useSavedRoutes";
import type { SavedRoute } from "../../../../backend/src/types";

interface SavedRoutesListProps {
  onSelect?: (route: SavedRoute) => void;
}

export function SavedRoutesList({ onSelect }: SavedRoutesListProps) {
  const { data: savedRoutes, isLoading } = useSavedRoutes();
  const deleteSavedRoute = useDeleteSavedRoute();

  // Nothing saved yet: keep the planner uncluttered.
  if (!isLoading && (!savedRoutes || savedRoutes.length === 0)) {
    return null;
  }

  const handleDelete = (route: SavedRoute) => {
    deleteSavedRoute.mutate(route.id, {
      onSuccess: () => toast("Removed saved route", { description: route.label }),
      onError: () => toast.error("Couldn't remove route"),
    });
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Bookmark className="h-4 w-4 text-emerald-400" />
        <h2 className="text-sm font-semibold text-foreground">Saved Routes</h2>
        {savedRoutes ? (
          <span className="text-xs text-muted-foreground">({savedRoutes.length})</span>
        ) : null}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading saved routes...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {savedRoutes?.map((route) => (
            <Card
              key={route.id}
              className="group bg-card/50 border-border/50 backdrop-blur-sm p-3 flex items-center gap-2"
            >
              <button
                type="button"
                onClick={() => onSelect?.(route)}
                className={cn(
                  "flex-1 min-w-0 text-left",
                  onSelect && "cursor-pointer hover:opacity-80 transition-opacity"
                )}
              >
                <div className="flex items-center gap-1.5 text-sm font-medium text-foreground truncate">
                  <span className="truncate">{route.origin}</span>
                  <ArrowRight className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                  <span className="truncate">{route.destination}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {route.preferEco && (
                    <Badge
                      variant="secondary"
                      className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 gap-1 text-[10px] py-0"
                    >
                      <Leaf className="h-2.5 w-2.5" />
                      Eco
                    </Badge>
                  )}
                  {route.avoidHazards && (
                    <Badge
                      variant="secondary"
                      className="bg-amber-500/15 text-amber-400 border-amber-500/30 gap-1 text-[10px] py-0"
                    >
                      <ShieldCheck className="h-2.5 w-2.5" />
                      Avoid hazards
                    </Badge>
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDelete(route)}
                disabled={deleteSavedRoute.isPending}
                aria-label={`Delete ${route.label}`}
                className="flex-shrink-0 p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
