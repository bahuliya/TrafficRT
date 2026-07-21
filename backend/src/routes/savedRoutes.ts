import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { SavedRoute } from "../types";
import { CreateSavedRouteRequestSchema, SavedRouteSchema } from "../types";

const savedRoutesRouter = new Hono();

// In-memory store (resets on restart), consistent with community reports.
const savedRoutes: SavedRoute[] = [];

function generateId(): string {
  return `saved_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

savedRoutesRouter.get("/", (c) => {
  const sorted = [...savedRoutes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return c.json({ data: sorted });
});

savedRoutesRouter.post("/", zValidator("json", CreateSavedRouteRequestSchema), (c) => {
  const body = c.req.valid("json");

  const existing = savedRoutes.find(
    (r) =>
      r.origin.toLowerCase() === body.origin.toLowerCase() &&
      r.destination.toLowerCase() === body.destination.toLowerCase()
  );
  if (existing) {
    return c.json({ error: { message: "This route is already saved", code: "DUPLICATE" } }, 409);
  }

  const saved = SavedRouteSchema.parse({
    id: generateId(),
    label: body.label?.trim() || `${body.origin} → ${body.destination}`,
    origin: body.origin,
    destination: body.destination,
    preferEco: body.preferEco,
    avoidHazards: body.avoidHazards,
    createdAt: new Date().toISOString(),
  });

  savedRoutes.push(saved);
  return c.json({ data: saved }, 201);
});

savedRoutesRouter.delete("/:id", (c) => {
  const id = c.req.param("id");
  const index = savedRoutes.findIndex((r) => r.id === id);
  if (index === -1) {
    return c.json({ error: { message: "Saved route not found", code: "NOT_FOUND" } }, 404);
  }

  const [removed] = savedRoutes.splice(index, 1);
  return c.json({ data: removed });
});

export { savedRoutesRouter };
