/**
 * Insights aggregation: turns live camera hazard statuses and community
 * reports into summary statistics for the analytics dashboard.
 *
 * All functions are pure so they can be reused and tested independently of
 * the HTTP layer.
 */

import type {
  Camera,
  CategoryCount,
  CommunityReport,
  InsightsResponse,
  ReportType,
  SeverityBucket,
  SeverityDistribution,
} from "./types";

/**
 * Approximate severity weights for community report types. Mirrors the values
 * used when reports are merged into the routing hazard layer.
 */
export const REPORT_SEVERITY: Record<ReportType, number> = {
  flooding: 7,
  obstruction: 6,
  pothole: 5,
  blocked_bike_lane: 4,
  broken_charger: 3,
  other: 4,
};

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  broken_charger: "Broken Charger",
  blocked_bike_lane: "Blocked Bike Lane",
  pothole: "Pothole",
  flooding: "Flooding",
  obstruction: "Obstruction",
  other: "Other",
};

/** Map a 0-10 severity score into a coarse bucket for distribution charts. */
export function severityBucket(severity: number): SeverityBucket {
  if (severity <= 0) return "clear";
  if (severity <= 3) return "minor";
  if (severity <= 6) return "moderate";
  return "severe";
}

interface Accumulator {
  count: number;
  severityTotal: number;
}

function toCategoryCounts(map: Map<string, Accumulator>): CategoryCount[] {
  return Array.from(map.entries())
    .map(([label, { count, severityTotal }]) => ({
      label,
      count,
      avgSeverity: count > 0 ? Number((severityTotal / count).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Build the full insights payload from the current cameras and reports.
 */
export function buildInsights(
  cameras: Camera[],
  reports: CommunityReport[]
): InsightsResponse {
  const activeCameras = cameras.filter(
    (cam) => cam.currentStatus.hazard && cam.currentStatus.type !== "Clear"
  );

  const hazardTypeMap = new Map<string, Accumulator>();
  for (const cam of activeCameras) {
    const { type, severity } = cam.currentStatus;
    const entry = hazardTypeMap.get(type) ?? { count: 0, severityTotal: 0 };
    entry.count += 1;
    entry.severityTotal += severity;
    hazardTypeMap.set(type, entry);
  }

  const openReports = reports.filter((r) => r.status !== "resolved");
  const reportTypeMap = new Map<string, Accumulator>();
  for (const report of openReports) {
    const label = REPORT_TYPE_LABELS[report.type] ?? report.type;
    const severity = REPORT_SEVERITY[report.type] ?? 4;
    const entry = reportTypeMap.get(label) ?? { count: 0, severityTotal: 0 };
    entry.count += 1;
    entry.severityTotal += severity;
    reportTypeMap.set(label, entry);
  }

  const bucketCounts: Record<SeverityBucket, number> = {
    clear: 0,
    minor: 0,
    moderate: 0,
    severe: 0,
  };
  for (const cam of activeCameras) {
    bucketCounts[severityBucket(cam.currentStatus.severity)] += 1;
  }
  for (const report of openReports) {
    bucketCounts[severityBucket(REPORT_SEVERITY[report.type] ?? 4)] += 1;
  }

  const severityDistribution: SeverityDistribution[] = (
    ["clear", "minor", "moderate", "severe"] as SeverityBucket[]
  ).map((bucket) => ({ bucket, count: bucketCounts[bucket] }));

  const allSeverities = [
    ...activeCameras.map((cam) => cam.currentStatus.severity),
    ...openReports.map((report) => REPORT_SEVERITY[report.type] ?? 4),
  ];
  const avgHazardSeverity =
    allSeverities.length > 0
      ? Number(
          (allSeverities.reduce((sum, s) => sum + s, 0) / allSeverities.length).toFixed(1)
        )
      : 0;

  const hotspot = activeCameras.reduce<Camera | null>((worst, cam) => {
    if (!worst || cam.currentStatus.severity > worst.currentStatus.severity) return cam;
    return worst;
  }, null);

  return {
    summary: {
      totalCameras: cameras.length,
      activeHazards: activeCameras.length,
      clearCameras: cameras.length - activeCameras.length,
      communityReports: openReports.length,
      verifiedReports: openReports.filter((r) => r.verifiedByAi).length,
      avgHazardSeverity,
      hotspotLocation: hotspot ? hotspot.locationName : null,
      generatedAt: new Date().toISOString(),
    },
    hazardsByType: toCategoryCounts(hazardTypeMap),
    reportsByType: toCategoryCounts(reportTypeMap),
    severityDistribution,
    bySource: [
      { source: "camera", count: activeCameras.length },
      { source: "report", count: openReports.length },
    ],
  };
}
