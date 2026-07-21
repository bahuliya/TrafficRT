import { Hono } from "hono";
import type { Camera, CommunityReport } from "../types";
import { buildInsights } from "../insights";

const insightsRouter = new Hono();

async function fetchCameras(backendUrl: string): Promise<Camera[]> {
  try {
    const res = await fetch(`${backendUrl}/api/cameras`);
    if (!res.ok) return [];
    const json = (await res.json()) as { data: Camera[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

async function fetchReports(backendUrl: string): Promise<CommunityReport[]> {
  try {
    const res = await fetch(`${backendUrl}/api/reports`);
    if (!res.ok) return [];
    const json = (await res.json()) as { data: CommunityReport[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

insightsRouter.get("/", async (c) => {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";

  const [cameras, reports] = await Promise.all([
    fetchCameras(backendUrl),
    fetchReports(backendUrl),
  ]);

  return c.json({ data: buildInsights(cameras, reports) });
});

export { insightsRouter };
