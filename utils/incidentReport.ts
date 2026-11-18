import { File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import * as XLSX from "xlsx";
import { AGENCIES } from "../constants/agencies";
import { INCIDENT_STATUSES } from "../constants/incidentStatus";
import { INJURY_LEVELS } from "../constants/injuryLevels";
// Report generation for the admin Reports screen: summarizes the incidents in
// a period and exports them as a PDF or an Excel workbook, each with the
// summary breakdowns and the incident list.

export type ReportIncident = {
  id: string;
  userEmail?: string;
  category?: string;
  situation?: string;
  /** What the reporter typed when the incident type is "Other". */
  description?: string;
  injuryLevel?: string;
  location?: string;
  status?: string;
  involvedAgency?: string;
  createdAt?: { toDate: () => Date };
};

export type ReportPeriodKey =
  | "last7"
  | "last30"
  | "thisMonth"
  | "lastMonth"
  | "thisYear";

export const REPORT_PERIODS: { key: ReportPeriodKey; label: string }[] = [
  { key: "last7", label: "Last 7 days" },
  { key: "last30", label: "Last 30 days" },
  { key: "thisMonth", label: "This month" },
  { key: "lastMonth", label: "Last month" },
  { key: "thisYear", label: "This year" },
];

export type ReportRange = { start: Date; end: Date; label: string };

// Returns the period as [start, end) plus the equally long period right
// before it, which the report compares against.
export function getReportRanges(
  key: ReportPeriodKey,
  now = new Date(),
): { current: ReportRange; previous: ReportRange } {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const tomorrow = new Date(startOfToday);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const label = REPORT_PERIODS.find((p) => p.key === key)?.label ?? "";

  const daysBack = (days: number) => {
    const start = new Date(tomorrow);
    start.setDate(start.getDate() - days);
    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - days);
    return {
      current: { start, end: tomorrow, label },
      previous: { start: prevStart, end: start, label: "previous period" },
    };
  };

  const y = now.getFullYear();
  const m = now.getMonth();
  switch (key) {
    case "last7":
      return daysBack(7);
    case "last30":
      return daysBack(30);
    case "thisMonth":
      return {
        current: { start: new Date(y, m, 1), end: tomorrow, label },
        previous: {
          start: new Date(y, m - 1, 1),
          end: new Date(y, m, 1),
          label: "last month",
        },
      };
    case "lastMonth":
      return {
        current: {
          start: new Date(y, m - 1, 1),
          end: new Date(y, m, 1),
          label,
        },
        previous: {
          start: new Date(y, m - 2, 1),
          end: new Date(y, m - 1, 1),
          label: "the month before",
        },
      };
    case "thisYear":
      return {
        current: { start: new Date(y, 0, 1), end: tomorrow, label },
        previous: {
          start: new Date(y - 1, 0, 1),
          end: new Date(y, 0, 1),
          label: "last year",
        },
      };
  }
}

export type CountRow = { label: string; value: number };

export type ReportSummary = {
  total: number;
  previousTotal: number;
  /** Percent change vs the previous period, or null when it had none. */
  change: number | null;
  resolutionRate: number;
  byStatus: (CountRow & { color: string })[];
  byCategory: CountRow[];
  byInjury: CountRow[];
  byAgency: CountRow[];
};

const NOT_SPECIFIED = "Not specified";

function countBy(
  incidents: ReportIncident[],
  pick: (i: ReportIncident) => string | undefined,
): Map<string, number> {
  const counts = new Map<string, number>();
  incidents.forEach((incident) => {
    const key = pick(incident) || NOT_SPECIFIED;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return counts;
}

// Known values in their fixed order first (dropping zeros), then anything
// unexpected - e.g. levels from older reports - so no incident goes uncounted.
function orderedRows(counts: Map<string, number>, order: readonly string[]) {
  const rows = order
    .filter((label) => counts.has(label))
    .map((label) => ({ label, value: counts.get(label) ?? 0 }));
  counts.forEach((value, label) => {
    if (!order.includes(label)) rows.push({ label, value });
  });
  return rows;
}

export function summarizeIncidents(
  incidents: ReportIncident[],
  previousTotal: number,
): ReportSummary {
  const total = incidents.length;
  const statusCounts = countBy(incidents, (i) => i.status ?? "pending");
  const resolved = statusCounts.get("resolved") ?? 0;

  const byCategory = Array.from(
    countBy(incidents, (i) => i.category || i.situation),
    ([label, value]) => ({ label, value }),
  ).sort((a, b) => b.value - a.value);

  return {
    total,
    previousTotal,
    change:
      previousTotal > 0
        ? Math.round(((total - previousTotal) / previousTotal) * 100)
        : null,
    resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
    byStatus: INCIDENT_STATUSES.map((s) => ({
      label: s.label,
      color: s.color,
      value: statusCounts.get(s.key) ?? 0,
    })),
    byCategory,
    byInjury: orderedRows(
      countBy(incidents, (i) => i.injuryLevel),
      [...INJURY_LEVELS, NOT_SPECIFIED],
    ),
    byAgency: orderedRows(
      countBy(incidents, (i) => i.involvedAgency),
      [...AGENCIES, NOT_SPECIFIED],
    ),
  };
}

const statusLabel = (status?: string) =>
  INCIDENT_STATUSES.find((s) => s.key === (status ?? "pending"))?.label ??
  status ??
  "";

const formatDate = (d: Date) =>
  d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const formatDateTime = (d?: Date) =>
  d
    ? d.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

// The range end is exclusive, so the last day shown is the day before it.
export const formatRange = (range: ReportRange) => {
  const lastDay = new Date(range.end);
  lastDay.setDate(lastDay.getDate() - 1);
  return `${formatDate(range.start)} – ${formatDate(lastDay)}`;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

type ReportMeta = {
  range: ReportRange;
  previousLabel: string;
  scope: string;
  generatedBy: string;
};

function countTable(title: string, rows: CountRow[], total: number) {
  if (rows.length === 0) return "";
  const body = rows
    .map((row) => {
      const pct = total > 0 ? Math.round((row.value / total) * 100) : 0;
      return `<tr><td>${escapeHtml(row.label)}</td><td class="num">${row.value}</td><td class="num">${pct}%</td></tr>`;
    })
    .join("");
  return `<h2>${escapeHtml(title)}</h2>
    <table><thead><tr><th>${escapeHtml(title.replace(/^By /, ""))}</th><th class="num">Count</th><th class="num">Share</th></tr></thead>
    <tbody>${body}</tbody></table>`;
}

export function buildReportHtml(
  incidents: ReportIncident[],
  summary: ReportSummary,
  meta: ReportMeta,
): string {
  const changeText =
    summary.change === null
      ? `No reports in ${escapeHtml(meta.previousLabel)}`
      : `${summary.change >= 0 ? "+" : ""}${summary.change}% vs ${escapeHtml(meta.previousLabel)} (${summary.previousTotal})`;

  const statusCards = summary.byStatus
    .map(
      (s) =>
        `<div class="card"><div class="big" style="color:${s.color}">${s.value}</div><div class="muted">${escapeHtml(s.label)}</div></div>`,
    )
    .join("");

  const incidentRows = incidents
    .map(
      (i) => `<tr>
        <td>${escapeHtml(formatDateTime(i.createdAt?.toDate?.()))}</td>
        <td>${escapeHtml(i.category || i.situation || NOT_SPECIFIED)}</td>
        <td>${escapeHtml(i.injuryLevel || NOT_SPECIFIED)}</td>
        <td>${escapeHtml(i.location || "Not provided")}</td>
        <td>${escapeHtml(i.involvedAgency || "")}</td>
        <td>${escapeHtml(statusLabel(i.status))}</td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body { font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif; color: #1a1a2e; margin: 32px; font-size: 12px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 15px; margin: 24px 0 8px; }
  .muted { color: #666; }
  .cards { display: flex; gap: 12px; margin-top: 16px; }
  .card { flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 12px; }
  .big { font-size: 24px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
  th { background: #f4f5f7; font-weight: 600; }
  .num { text-align: right; }
  .incidents td { font-size: 11px; }
  tr { page-break-inside: avoid; }
</style></head>
<body>
  <h1>Incident Report</h1>
  <div class="muted">${escapeHtml(meta.range.label)}: ${escapeHtml(formatRange(meta.range))}</div>
  <div class="muted">Scope: ${escapeHtml(meta.scope)}</div>
  <div class="muted">Generated ${escapeHtml(formatDateTime(new Date()))} by ${escapeHtml(meta.generatedBy)}</div>

  <div class="cards">
    <div class="card"><div class="big">${summary.total}</div><div class="muted">Total incidents</div><div class="muted">${changeText}</div></div>
    <div class="card"><div class="big">${summary.resolutionRate}%</div><div class="muted">Resolution rate</div></div>
  </div>
  <div class="cards">${statusCards}</div>

  ${countTable("By incident type", summary.byCategory, summary.total)}
  ${countTable("By injury level", summary.byInjury, summary.total)}
  ${summary.byAgency.length > 1 ? countTable("By agency", summary.byAgency, summary.total) : ""}

  <h2>Incidents (${incidents.length})</h2>
  ${
    incidents.length === 0
      ? `<p class="muted">No incidents were reported in this period.</p>`
      : `<table class="incidents"><thead><tr><th>Date</th><th>Incident</th><th>Injury level</th><th>Location</th><th>Agency</th><th>Status</th></tr></thead><tbody>${incidentRows}</tbody></table>`
  }
</body></html>`;
}

type XlsxCell = string | number | Date | null;

const PERCENT_FORMAT = "0%";
const DATE_FORMAT = "mmm d, yyyy h:mm AM/PM";

// A CSV can't store column widths, so Excel opened every column narrow and
// cut the text off. Size each column to its longest value instead (capped so
// a long address doesn't make one column screen-wide).
function fitColumns(rows: XlsxCell[][], fixed: Record<number, number> = {}) {
  const widths: number[] = [];
  rows.forEach((row) =>
    row.forEach((cell, col) => {
      const length = cell instanceof Date ? 0 : String(cell ?? "").length;
      widths[col] = Math.max(widths[col] ?? 0, length);
    }),
  );
  return widths.map((width, col) => ({
    wch: fixed[col] ?? Math.min(Math.max(width + 2, 10), 60),
  }));
}

// Same breakdown tables as the PDF: label, count, and share (the row's
// percentage of all incidents in the period), followed by a blank row. Share
// is a real number formatted as a percentage, so Excel can sum/chart it.
function countSection(title: string, rows: CountRow[], total: number) {
  if (rows.length === 0) return [];
  return [
    [title],
    [title.replace(/^By /, ""), "Count", "Share"],
    ...rows.map((row) => [
      row.label,
      row.value,
      total > 0 ? row.value / total : 0,
    ]),
    [],
  ];
}

// An Excel workbook with two sheets: "Summary" (the same totals and
// breakdowns as the PDF) and "Incidents" (one row per incident, with a
// filter on the header row). Returned as base64 .xlsx bytes.
export function buildReportXlsx(
  incidents: ReportIncident[],
  summary: ReportSummary,
  meta: ReportMeta,
): string {
  const summaryRows: XlsxCell[][] = [
    ["Incident Report"],
    [`${meta.range.label}: ${formatRange(meta.range)}`],
    [`Scope: ${meta.scope}`],
    [`Generated ${formatDateTime(new Date())} by ${meta.generatedBy}`],
    [],
    ["Total incidents", summary.total],
    ["Resolution rate", summary.resolutionRate / 100],
    ...summary.byStatus.map((s) => [s.label, s.value]),
    [],
    ...countSection("By incident type", summary.byCategory, summary.total),
    ...countSection("By injury level", summary.byInjury, summary.total),
    ...(summary.byAgency.length > 1
      ? countSection("By agency", summary.byAgency, summary.total)
      : []),
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  // Percent format for the resolution rate and every Share column cell.
  summaryRows.forEach((row, r) => {
    const isShareRow = row.length === 3 && typeof row[2] === "number";
    const isRateRow = row[0] === "Resolution rate";
    if (isShareRow || isRateRow) {
      const cell =
        summarySheet[XLSX.utils.encode_cell({ r, c: isRateRow ? 1 : 2 })];
      if (cell) cell.z = PERCENT_FORMAT;
    }
  });
  // The long title lines in column A would otherwise stretch it very wide.
  summarySheet["!cols"] = fitColumns(summaryRows.slice(5), { 1: 10, 2: 10 });

  const header = [
    "Date reported",
    "Incident",
    "Description",
    "Injury level",
    "Location",
    "Agency",
    "Status",
    "Reporter email",
    "Incident ID",
  ];
  const incidentRows: XlsxCell[][] = [
    header,
    ...incidents.map((i) => [
      i.createdAt?.toDate?.() ?? null,
      i.category || i.situation || NOT_SPECIFIED,
      i.description || "",
      i.injuryLevel || NOT_SPECIFIED,
      i.location || "Not provided",
      i.involvedAgency || "",
      statusLabel(i.status),
      i.userEmail || "",
      i.id,
    ]),
  ];
  const incidentsSheet = XLSX.utils.aoa_to_sheet(incidentRows, {
    cellDates: true,
    dateNF: DATE_FORMAT,
  });
  incidentsSheet["!cols"] = fitColumns(incidentRows, { 0: 22 });
  if (incidents.length > 0) {
    incidentsSheet["!autofilter"] = { ref: incidentsSheet["!ref"] ?? "A1" };
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
  XLSX.utils.book_append_sheet(workbook, incidentsSheet, "Incidents");
  // Cells are written as typed strings/numbers, never formulas, so a crafted
  // location or category can't execute when the file is opened.
  return XLSX.write(workbook, {
    type: "base64",
    bookType: "xlsx",
    cellDates: true,
  });
}

export function reportFileName(range: ReportRange, extension: string) {
  const day = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const date = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${date}`;
  };
  const lastDay = new Date(range.end);
  lastDay.setDate(lastDay.getDate() - 1);
  return `incident-report_${day(range.start)}_to_${day(lastDay)}.${extension}`;
}

// On web, expo-print ignores the html and just calls window.print() on the
// admin app itself, so open the report in its own tab instead - styled like
// the phone's PDF viewer (dark bar with the file name, the report as a white
// page) - with a button that opens the print dialog for "Save as PDF". The
// tab's title becomes the browser's suggested PDF file name.
function openReportPdfViewer(html: string, fileName: string) {
  // Must run before any await so the browser still treats it as part of the
  // click and doesn't block the new tab as a pop-up.
  const viewer = window.open("", "_blank");
  if (!viewer) {
    throw new Error(
      "Your browser blocked the report tab. Allow pop-ups for this site and try again.",
    );
  }
  const title = escapeHtml(fileName.replace(/\.pdf$/i, ""));
  const viewerHead = `<title>${title}</title>
<style>
  @page { size: A4; margin: 12mm; }
  @media screen {
    body.viewer { margin: 0; background: #2b2b2b; }
    .viewer-bar { position: sticky; top: 0; z-index: 1; display: flex; align-items: center; gap: 12px;
      padding: 14px 24px; background: #000; color: #fff; font-size: 18px; }
    .viewer-bar .name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .viewer-bar button { font: inherit; font-size: 14px; font-weight: 600; cursor: pointer;
      border: 0; border-radius: 6px; padding: 8px 16px; }
    .viewer-bar .primary { background: #007AFF; color: #fff; }
    .viewer-bar .secondary { background: #333; color: #fff; }
    .viewer-page { width: 794px; max-width: calc(100% - 32px); box-sizing: border-box; margin: 32px auto;
      padding: 40px; background: #fff; box-shadow: 0 4px 24px rgba(0,0,0,0.5); }
  }
  @media print {
    .viewer-bar { display: none; }
    body.viewer { margin: 0; }
  }
</style></head>`;
  const viewerBar = `<body class="viewer">
<div class="viewer-bar">
  <span class="name">${title}.pdf</span>
  <button class="primary" onclick="window.print()">Save as PDF</button>
  <button class="secondary" onclick="window.close()">Close</button>
</div>
<div class="viewer-page">`;
  const page = html
    .replace("</head>", viewerHead)
    .replace("<body>", viewerBar)
    .replace("</body>", "</div></body>");
  viewer.document.open();
  viewer.document.write(page);
  viewer.document.close();
}

// On a phone: render the PDF and open the share sheet (save to Files, email,
// Messenger...). On web: open the report in a PDF-style viewer tab.
export async function exportReportPdf(html: string, fileName: string) {
  if (Platform.OS === "web") {
    openReportPdfViewer(html, fileName);
    return;
  }
  // expo-print saves under a random UUID in a folder the File API can't
  // read or move in Expo Go ("Missing 'READ' permission"). Take the PDF's
  // bytes back as base64 instead and write our own readably named copy in
  // the cache - the same place the CSV export writes. If that write fails,
  // share expo-print's own file rather than failing the export.
  const { uri, base64 } = await Print.printToFileAsync({ html, base64: true });
  let shareUri = uri;
  if (base64) {
    try {
      const named = new File(Paths.cache, fileName);
      if (named.exists) named.delete();
      named.create();
      named.write(base64, { encoding: "base64" });
      shareUri = named.uri;
    } catch (writeError) {
      console.warn(
        "Could not save named report PDF, sharing as-is:",
        writeError,
      );
    }
  }
  await shareFile(shareUri, "application/pdf", "com.adobe.pdf");
}

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// On web: download the .xlsx. On a phone: write it to the cache and open the
// share sheet, like the PDF.
export async function exportReportXlsx(base64: string, fileName: string) {
  if (Platform.OS === "web") {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: XLSX_MIME }));
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    return;
  }
  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(base64, { encoding: "base64" });
  await shareFile(
    file.uri,
    XLSX_MIME,
    "org.openxmlformats.spreadsheetml.sheet",
  );
}

async function shareFile(uri: string, mimeType: string, UTI: string) {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Sharing isn't available on this device.");
  }
  await Sharing.shareAsync(uri, { mimeType, UTI, dialogTitle: "Share report" });
}
