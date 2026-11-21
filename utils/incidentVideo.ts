import { API_BASE_URL_CANDIDATES } from "../config/api";

export function getIncidentVideoUrlCandidates(videoUrl: string): string[] {
  try {
    const savedUrl = new URL(videoUrl);
    if (savedUrl.protocol !== "http:" && savedUrl.protocol !== "https:") {
      return [];
    }

    const candidates = [savedUrl.href];
    // Only videos stored on the backend's own disk can be re-pointed at
    // another backend address; Firebase Storage URLs are already permanent.
    if (!savedUrl.pathname.startsWith("/uploads/")) {
      return candidates;
    }
    for (const baseUrl of API_BASE_URL_CANDIDATES) {
      const base = new URL(baseUrl);
      candidates.push(
        new URL(
          `${savedUrl.pathname}${savedUrl.search}`,
          `${base.origin}/`,
        ).href,
      );
    }
    return [...new Set(candidates)];
  } catch {
    return [];
  }
}
