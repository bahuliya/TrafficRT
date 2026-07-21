import { useState } from "react";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCreateSavedRoute } from "@/hooks/useSavedRoutes";
import { ApiError } from "@/lib/api";

interface SaveRouteButtonProps {
  origin: string;
  destination: string;
  preferEco: boolean;
  avoidHazards: boolean;
}

export function SaveRouteButton({
  origin,
  destination,
  preferEco,
  avoidHazards,
}: SaveRouteButtonProps) {
  const createSavedRoute = useCreateSavedRoute();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    createSavedRoute.mutate(
      { origin, destination, preferEco, avoidHazards },
      {
        onSuccess: () => {
          setSaved(true);
          toast.success("Route saved", { description: `${origin} → ${destination}` });
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 409) {
            setSaved(true);
            toast("Already saved", { description: "This trip is already in your saved routes." });
            return;
          }
          toast.error("Couldn't save route", {
            description: err instanceof Error ? err.message : "Please try again.",
          });
        },
      }
    );
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSave}
      disabled={createSavedRoute.isPending || saved}
      className="border-border/50"
    >
      {createSavedRoute.isPending ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : saved ? (
        <BookmarkCheck className="h-4 w-4 mr-2 text-emerald-400" />
      ) : (
        <Bookmark className="h-4 w-4 mr-2" />
      )}
      {saved ? "Saved" : "Save route"}
    </Button>
  );
}
