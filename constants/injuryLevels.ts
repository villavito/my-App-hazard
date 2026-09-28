// How badly people were hurt, picked by the reporter below the location and
// saved on the incident as `injuryLevel` so responders can triage. Ordered
// from least to most severe.
export const INJURY_LEVELS = [
  "No Injury",
  "Minor (First Aid)",
  "Moderate (Medical Attention)",
  "Serious (Hospitalization)",
  "Critical (Life-threatening)",
  "Fatality",
] as const;
