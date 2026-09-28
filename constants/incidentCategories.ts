import type { Agency } from "./agencies";

// The incident types each agency handles. The reporter picks one after
// choosing an agency, and it's saved on the incident as `category` so that
// agency's admins can see and filter by it. "Other" stays last in every list
// as the catch-all.
export const INCIDENT_CATEGORIES: Record<Agency, readonly string[]> = {
  PNP: [
    "Theft / Robbery",
    "Physical Assault",
    "Vehicular Accident",
    "Illegal Drugs",
    "Public Disturbance",
    "Missing Person",
    "Other",
  ],
  BFP: [
    "Residential Fire",
    "Commercial / Building Fire",
    "Vehicle Fire",
    "Grass / Forest Fire",
    "Electrical Fire",
    "Gas Leak",
    "Other",
  ],
  LDRRMC: [
    "Flood",
    "Landslide",
    "Earthquake Damage",
    "Typhoon Damage",
    "Fallen Tree / Debris",
    "Evacuation Needed",
    "Other",
  ],
  Barangay: [
    "Noise Complaint",
    "Neighbor Dispute",
    "Stray Animals",
    "Garbage / Sanitation",
    "Road Obstruction",
    "Streetlight / Utility Problem",
    "Other",
  ],
  REDCROSS: [
    "Medical Emergency",
    "Injury / Wound",
    "Drowning",
    "Mass Casualty",
    "Blood Request",
    "Other",
  ],
};
