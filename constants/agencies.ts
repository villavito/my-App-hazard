export const AGENCIES = ['PNP', 'BFP', 'LDRRMC', 'Barangay'] as const;

export type Agency = (typeof AGENCIES)[number];

export const AGENCY_LABELS: Record<Agency, string> = {
  PNP: 'Philippine National Police',
  BFP: 'Bureau of Fire Protection',
  LDRRMC: 'Local Disaster Risk Reduction Management Council',
  Barangay: 'Barangay Official',
};

export const AGENCY_COLORS: Record<Agency, string> = {
  PNP: '#1e3a8a',
  BFP: '#dc2626',
  LDRRMC: '#f57c00',
  Barangay: '#2e7d32',
};
