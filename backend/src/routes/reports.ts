import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { CommunityReport, GeminiScoutVerification } from "../types";
import { CommunityReportSchema, CreateReportRequestSchema } from "../types";
import { verifyReportImage, isGeminiConfigured } from "../gemini";
import { getMockScoutVerification } from "../mockData";

const reportsRouter = new Hono();

const reports: CommunityReport[] = [];

function generateReportId(): string {
  return `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

const ReportFilterSchema = z.object({
  status: z.enum(["pending", "verified", "resolved"]).optional(),
});

reportsRouter.get("/", zValidator("query", ReportFilterSchema), (c) => {
  const { status } = c.req.valid("query");
  const filtered = status ? reports.filter((r) => r.status === status) : reports;
  const sorted = [...filtered].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return c.json({ data: sorted });
});

reportsRouter.post("/", zValidator("json", CreateReportRequestSchema), async (c) => {
  const body = c.req.valid("json");
  const reportId = generateReportId();
  const timestamp = new Date().toISOString();

  const imageUrl = body.imageBase64
    ? `https://storage.trafficrt.app/reports/${reportId}.jpg`
    : undefined;

  let verifiedByAi = false;
  let aiExplanation: string | undefined;
  let status: "pending" | "verified" | "resolved" = "pending";

  if (body.imageBase64) {
    let verification: GeminiScoutVerification;

    if (isGeminiConfigured()) {
      try {
        verification = await verifyReportImage(body.type, body.imageBase64);
      } catch {
        verification = getMockScoutVerification(body.type);
      }
    } else {
      verification = getMockScoutVerification(body.type);
    }

    verifiedByAi = verification.verified;
    aiExplanation = verification.explanation;
    status = verification.verified ? "verified" : "pending";
  }

  const newReport = CommunityReportSchema.parse({
    reportId,
    type: body.type,
    description: body.description,
    lat: body.lat,
    lng: body.lng,
    imageUrl,
    verifiedByAi,
    aiExplanation,
    timestamp,
    status,
  });

  reports.push(newReport);
  return c.json({ data: newReport }, 201);
});

reportsRouter.get("/:reportId", (c) => {
  const report = reports.find((r) => r.reportId === c.req.param("reportId"));
  if (!report) {
    return c.json({ error: { message: "Report not found", code: "NOT_FOUND" } }, 404);
  }
  return c.json({ data: report });
});

reportsRouter.patch("/:reportId/resolve", (c) => {
  const reportIndex = reports.findIndex((r) => r.reportId === c.req.param("reportId"));
  if (reportIndex === -1) {
    return c.json({ error: { message: "Report not found", code: "NOT_FOUND" } }, 404);
  }

  reports[reportIndex] = { ...reports[reportIndex]!, status: "resolved" };
  return c.json({ data: reports[reportIndex] });
});

export { reportsRouter };
