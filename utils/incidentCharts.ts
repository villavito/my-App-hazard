import type { StatusSlice } from "../components/IncidentStatusChart";
import type { TrendPoint } from "../components/IncidentTrendChart";
import { INCIDENT_STATUSES } from "../constants/incidentStatus";

// Shared by the admin and super admin dashboards so both charts bucket
// incidents the same way.

export function buildStatusData(
  incidents: { status?: string }[],
): StatusSlice[] {
  const counts = { pending: 0, in_progress: 0, resolved: 0 };
  incidents.forEach((incident) => {
    const status = incident.status ?? "pending";
    if (status in counts) {
      counts[status as keyof typeof counts] += 1;
    }
  });
  return INCIDENT_STATUSES.map((slice) => ({
    ...slice,
    value: counts[slice.key as keyof typeof counts],
  }));
}

export function buildTrendData(
  incidents: { createdAt?: { toDate: () => Date } }[],
  days: number,
): TrendPoint[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bucketDates: Date[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    bucketDates.push(d);
  }

  const keyOf = (d: Date) =>
    `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const counts = new Map<string, number>(bucketDates.map((d) => [keyOf(d), 0]));

  incidents.forEach((incident) => {
    const createdAt = incident.createdAt?.toDate?.();
    if (!createdAt) return;
    const key = keyOf(createdAt);
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  });

  return bucketDates.map((d) => ({
    label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    fullLabel: d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }),
    value: counts.get(keyOf(d)) ?? 0,
  }));
}
