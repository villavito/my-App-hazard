export const AGENCIES = ['PNP', 'BFP', 'RHU', 'BDRRMC'] as const;

export type Agency = (typeof AGENCIES)[number];

export const AGENCY_LABELS: Record<Agency, string> = {
  PNP: 'Philippine National Police',
  BFP: 'Bureau of Fire Protection',
  RHU: 'Rural Health Unit',
  BDRRMC: 'Barangay DRRMC',
};

export const AGENCY_COLORS: Record<Agency, string> = {
  PNP: '#1e3a8a',
  BFP: '#dc2626',
  RHU: '#16a34a',
  BDRRMC: '#ea580c',
};
