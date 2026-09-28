export const AGENCIES = [
  "PNP",
  "BFP",
  "LDRRMC",
  "Barangay",
  "REDCROSS",
] as const;

export type Agency = (typeof AGENCIES)[number];

export const AGENCY_LABELS: Record<Agency, string> = {
  PNP: "Philippine National Police",
  BFP: "Bureau of Fire Protection",
  LDRRMC: "Local Disaster Risk Reduction Management Council",
  Barangay: "Barangay Official",
  REDCROSS: "Philippine Red Cross",
};

export const AGENCY_COLORS: Record<Agency, string> = {
  PNP: "#1e3a8a",
  BFP: "#dc2626",
  LDRRMC: "#f57c00",
  Barangay: "#2e7d32",
  REDCROSS: "#a80fa1",
};

// How an @admin.com address names its agency: the part before "@" starts with
// the agency code or its full name, e.g. "ldrrmc01@admin.com" -> LDRRMC,
// "bureauoffireprotection@admin.com" -> BFP. Keep in sync with
// agencyEmailPatterns() in firestore.rules, which checks the same thing.
const AGENCY_EMAIL_PREFIXES: Record<Agency, string[]> = {
  PNP: ["pnp", "philippinenationalpolice"],
  BFP: ["bfp", "bureauoffireprotection"],
  LDRRMC: ["ldrrmc", "localdisasterriskreductionmanagementcouncil"],
  Barangay: ["barangay"],
  REDCROSS: ["redcross", "philippineredcross"],
};

export function inferAgencyFromEmail(email: string): Agency | undefined {
  const lower = email.trim().toLowerCase();
  if (!lower.endsWith("@admin.com")) return undefined;
  const localPart = lower.slice(0, lower.indexOf("@"));
  return AGENCIES.find((agency) =>
    AGENCY_EMAIL_PREFIXES[agency].some((prefix) =>
      localPart.startsWith(prefix),
    ),
  );
}
