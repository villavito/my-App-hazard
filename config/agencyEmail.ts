// Sends the "new incident" email to the agency straight from the app through
// EmailJS (free tier, sends via your Gmail), since the live site has no
// backend server. Optional: switched off until these are set in .env.local -
//   EXPO_PUBLIC_EMAILJS_SERVICE_ID, EXPO_PUBLIC_EMAILJS_TEMPLATE_ID,
//   EXPO_PUBLIC_EMAILJS_PUBLIC_KEY
// Without them, emails only go out in local development (backend/server.js),
// and admins still see every new report in their dashboard.

const env = (value: string | undefined) => (value ?? "").trim();

const EMAILJS_SERVICE_ID = env(process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID);
const EMAILJS_TEMPLATE_ID = env(process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID);
const EMAILJS_PUBLIC_KEY = env(process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY);

export const isEmailJsConfigured = Boolean(
  EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY,
);

// Same list as backend/server.js.
const AGENCY_EMAILS: Record<string, string> = {
  PNP: "philippinenationalpolice@gmail.com",
  BFP: "bureauoffireprotection@admin.com",
  LDRRMC: "ldrrmc@admin.com",
  REDCROSS: "philippineredcross@admin.com",
  Barangay: "barangay@admin.com",
};

const APP_URL = "https://incident-4a5a6.web.app";

type IncidentEmailData = {
  id: string;
  category?: string;
  description?: string;
  injuryLevel?: string;
  location?: string;
  userEmail?: string;
  status?: string;
  coordinates?: { latitude: number; longitude: number } | null;
};

// The email's layout lives in the EmailJS template; these are the values it
// fills in.
export async function sendAgencyEmail(
  agency: string,
  incident: IncidentEmailData,
): Promise<void> {
  const toEmail = AGENCY_EMAILS[agency];
  if (!toEmail) throw new Error(`Unknown agency: ${agency}`);

  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: toEmail,
        agency,
        category: incident.description
          ? `${incident.category} - ${incident.description}`
          : incident.category || "Not specified",
        injury_level: incident.injuryLevel || "Not specified",
        location: incident.location || "Not provided",
        coordinates: incident.coordinates
          ? `${incident.coordinates.latitude}, ${incident.coordinates.longitude}`
          : "Not provided",
        reported_by: incident.userEmail || "Anonymous",
        status: incident.status || "pending",
        incident_id: incident.id,
        incident_link: `${APP_URL}/admin/incident-detail?id=${encodeURIComponent(incident.id)}`,
      },
    }),
  });
  if (!response.ok) {
    throw new Error(`EmailJS ${response.status}: ${await response.text()}`);
  }
}
