import { Hono } from "hono";
import type { Camera, CameraStatus, GeminiHazardAnalysis } from "../types";
import { analyzeTrafficCameraImage, isGeminiConfigured } from "../gemini";
import { getMockCameras, getMockHazardAnalysis } from "../mockData";

const camerasRouter = new Hono();

const GDOT_CAMERA_API =
  "https://rnhp.dot.ga.gov/hosting/rest/services/web_trafficcameras/MapServer/0/query";

const ATLANTA_METRO_COUNTIES = ["Fulton", "DeKalb", "Cobb", "Gwinnett", "Clayton"];

interface GDOTCameraAttributes {
  URL: string;
  DEVICE_NAME: string;
  DEVICE_DESCRIPTION: string;
  PRIMARY_ROAD: string;
  CROSS_ROAD_NAME: string;
  CITY_NAME: string | null;
  COUNTY_NAME: string;
  LATITUDE: number;
  LONGITUDE: number;
}

interface GDOTCameraFeature {
  attributes: GDOTCameraAttributes;
}

interface GDOTAPIResponse {
  features: GDOTCameraFeature[];
}

let cameraCache: { data: Camera[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;
const hazardStatuses: Map<string, CameraStatus> = new Map();
let backgroundAnalysisInProgress = false;

function getDefaultStatus(): CameraStatus {
  return {
    hazard: false,
    type: "Clear",
    severity: 0,
    updatedAt: new Date().toISOString(),
    geminiExplanation: "Awaiting AI analysis. Click analyze or refresh to trigger real-time hazard detection.",
  };
}

function getCameraStatus(camId: string): CameraStatus {
  return hazardStatuses.get(camId) ?? getDefaultStatus();
}

async function analyzeSingleCamera(camera: Camera): Promise<CameraStatus> {
  let analysis: GeminiHazardAnalysis;

  if (isGeminiConfigured()) {
    try {
      analysis = await analyzeTrafficCameraImage(camera.imageUrl, camera.locationName);
    } catch {
      analysis = getMockHazardAnalysis(camera.locationName);
    }
  } else {
    analysis = getMockHazardAnalysis(camera.locationName);
  }

  const status: CameraStatus = {
    hazard: analysis.hazard_detected,
    type: analysis.type,
    severity: analysis.severity,
    updatedAt: new Date().toISOString(),
    geminiExplanation: analysis.description,
  };

  hazardStatuses.set(camera.camId, status);

  if (cameraCache) {
    const cached = cameraCache.data.find((c) => c.camId === camera.camId);
    if (cached) cached.currentStatus = status;
  }

  return status;
}

async function analyzeAllCamerasInBackground(cameras: Camera[]) {
  if (backgroundAnalysisInProgress || !isGeminiConfigured()) return;

  backgroundAnalysisInProgress = true;
  const BATCH_SIZE = 5;
  let analyzed = 0;
  let hazardsFound = 0;

  for (let i = 0; i < cameras.length; i += BATCH_SIZE) {
    const results = await Promise.allSettled(
      cameras.slice(i, i + BATCH_SIZE).map((cam) => analyzeSingleCamera(cam))
    );
    for (const result of results) {
      analyzed++;
      if (result.status === "fulfilled" && result.value.hazard) hazardsFound++;
    }
    console.log(`[Cameras] Analyzed ${analyzed}/${cameras.length} cameras (${hazardsFound} hazards found)`);
  }

  backgroundAnalysisInProgress = false;
  console.log(`[Cameras] Background analysis complete: ${analyzed} cameras, ${hazardsFound} hazards`);
}

async function fetchGDOTCameras(): Promise<Camera[]> {
  if (cameraCache && Date.now() - cameraCache.timestamp < CACHE_TTL_MS) {
    return cameraCache.data;
  }

  try {
    const countyFilter = ATLANTA_METRO_COUNTIES.map((c) => `COUNTY_NAME='${c}'`).join(" OR ");
    const params = new URLSearchParams({
      where: `ACTIVE=1 AND (${countyFilter})`,
      outFields: "URL,DEVICE_NAME,DEVICE_DESCRIPTION,PRIMARY_ROAD,CROSS_ROAD_NAME,CITY_NAME,COUNTY_NAME,LATITUDE,LONGITUDE",
      f: "json",
      resultRecordCount: "50",
    });

    const response = await fetch(`${GDOT_CAMERA_API}?${params}`);
    if (!response.ok) throw new Error(`GDOT API returned ${response.status}`);

    const data = (await response.json()) as GDOTAPIResponse;
    if (!data.features?.length) return getMockCameras();

    const cameras: Camera[] = data.features.map((feature) => {
      const attr = feature.attributes;
      const camId = attr.DEVICE_NAME.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const locationName = attr.CITY_NAME
        ? `${attr.PRIMARY_ROAD} at ${attr.CROSS_ROAD_NAME} (${attr.CITY_NAME})`
        : `${attr.PRIMARY_ROAD} at ${attr.CROSS_ROAD_NAME}`;

      return {
        camId,
        locationName,
        lat: attr.LATITUDE,
        lng: attr.LONGITUDE,
        imageUrl: `${attr.URL}?t=${Date.now()}`,
        currentStatus: getCameraStatus(camId),
      };
    });

    cameraCache = { data: cameras, timestamp: Date.now() };

    if (hazardStatuses.size === 0) {
      analyzeAllCamerasInBackground(cameras).catch((err) =>
        console.error("[Cameras] Background analysis error:", err)
      );
    }

    return cameras;
  } catch (error) {
    console.error("[Cameras] Error fetching from GDOT API:", error);
    return getMockCameras();
  }
}

camerasRouter.get("/", async (c) => {
  const cameras = await fetchGDOTCameras();
  return c.json({ data: cameras });
});

camerasRouter.get("/refresh", async (c) => {
  cameraCache = null;
  hazardStatuses.clear();
  const cameras = await fetchGDOTCameras();
  analyzeAllCamerasInBackground(cameras).catch((err) =>
    console.error("[Cameras] Refresh analysis error:", err)
  );
  return c.json({
    data: cameras,
    message: `Refreshed ${cameras.length} cameras from GDOT. AI analysis running in background.`,
  });
});

camerasRouter.get("/hazards/active", async (c) => {
  const cameras = await fetchGDOTCameras();
  const hazardCameras = cameras.filter((cam) => cam.currentStatus.hazard && cam.currentStatus.severity >= 3);
  return c.json({ data: hazardCameras, count: hazardCameras.length });
});

camerasRouter.get("/proxy-image", async (c) => {
  const url = c.req.query("url");
  if (!url) {
    return c.json({ error: { message: "Missing 'url' query parameter", code: "BAD_REQUEST" } }, 400);
  }

  try {
    const cleanUrl = url.split("?")[0]!;

    const proc = Bun.spawn(["curl", "-sL", "--max-time", "10", "-o", "-", cleanUrl], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const imageBuffer = await new Response(proc.stdout).arrayBuffer();
    await proc.exited;

    if (proc.exitCode !== 0 || imageBuffer.byteLength < 500) {
      return c.json({ error: { message: "Failed to fetch camera image", code: "FETCH_FAILED" } }, 502);
    }

    const ext = cleanUrl.split(".").pop()?.toLowerCase();
    const contentType = ext === "png" ? "image/png" : ext === "gif" ? "image/gif" : "image/jpeg";

    return new Response(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=15",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("[Cameras] Image proxy error:", error);
    return c.json({ error: { message: "Image proxy error", code: "PROXY_ERROR" } }, 500);
  }
});

camerasRouter.get("/:camId", async (c) => {
  const camId = c.req.param("camId");
  const cameras = await fetchGDOTCameras();
  const camera = cameras.find((cam) => cam.camId === camId);

  if (!camera) {
    return c.json({ error: { message: "Camera not found", code: "CAMERA_NOT_FOUND" } }, 404);
  }

  return c.json({ data: camera });
});

camerasRouter.post("/:camId/analyze", async (c) => {
  const camId = c.req.param("camId");
  const cameras = await fetchGDOTCameras();
  const camera = cameras.find((cam) => cam.camId === camId);

  if (!camera) {
    return c.json({ error: { message: "Camera not found", code: "CAMERA_NOT_FOUND" } }, 404);
  }

  if (!isGeminiConfigured()) {
    return c.json({ error: { message: "Gemini API key not configured", code: "API_NOT_CONFIGURED" } }, 503);
  }

  try {
    const analysis = await analyzeTrafficCameraImage(camera.imageUrl, camera.locationName);

    const newStatus: CameraStatus = {
      hazard: analysis.hazard_detected,
      type: analysis.type,
      severity: analysis.severity,
      updatedAt: new Date().toISOString(),
      geminiExplanation: analysis.description,
    };

    hazardStatuses.set(camId, newStatus);
    if (cameraCache) {
      const cached = cameraCache.data.find((c) => c.camId === camId);
      if (cached) cached.currentStatus = newStatus;
    }

    return c.json({ data: { camId, analysis, updatedStatus: newStatus } });
  } catch (error) {
    console.error(`[Cameras] Gemini analysis error for ${camId}:`, error);
    return c.json(
      { error: { message: error instanceof Error ? error.message : "Failed to analyze camera image", code: "ANALYSIS_FAILED" } },
      500
    );
  }
});

export { camerasRouter };
