import type { Ionicons } from "@expo/vector-icons";


// Single source of truth for how an incident's status is labeled, colored,
// and iconified across the admin screens (dashboard chart, reports pie,
// incident list badges). Keeps the colors consistent with the red/orange/
// green convention already used by getStatusColor() in incidents.tsx and
// incident-detail.tsx.
export const INCIDENT_STATUSES = [
  {
    key: "pending",
    label: "Pending",
    color: "#FF3B30",
    icon: "time-outline" as const,
  },
  {
    key: "in_progress",
    label: "In Progress",
    color: "#FF9500",
    icon: "refresh-outline" as const,
  },
  {
    key: "resolved",
    label: "Resolved",
    color: "#34C759",
    icon: "checkmark-circle-outline" as const,
  },
] satisfies {
  key: string;
  label: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}[];

export type IncidentStatusKey = (typeof INCIDENT_STATUSES)[number]["key"];
