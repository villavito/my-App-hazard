import Constants from 'expo-constants';
import { Platform } from 'react-native';

// The backend (backend/server.js) only runs on the dev machine, at port 3001:
// the live app has none (Firebase's free plan can't host one), and everything
// it needs works without one. In development it still sends agency emails and
// SMS reset codes.
//
// There's no single host alias that reaches it from every dev target - a
// physical device needs the PC's actual LAN IP, a standard Android Studio
// emulator needs 10.0.2.2, Genymotion needs 10.0.3.2, and a browser/iOS
// simulator needs localhost - so every candidate is tried in order.
function candidateHosts(): string[] {
  // Expo's dev server already knows the dev machine's LAN IP (it's how this
  // JS bundle got loaded in the first place) and exposes it as hostUri.
  const hostUri: string | undefined =
    Constants.expoConfig?.hostUri ??
    (Constants as unknown as { expoGoConfig?: { hostUri?: string } })
      .expoGoConfig?.hostUri;
  const lanHost = hostUri?.split(':')[0];

  const hosts = [
    lanHost,
    Platform.OS === 'android' ? '10.0.2.2' : undefined,
    Platform.OS === 'android' ? '10.0.3.2' : undefined,
    'localhost',
  ].filter((h): h is string => Boolean(h));

  return Array.from(new Set(hosts));
}

// A deployed backend, if you ever host one: set EXPO_PUBLIC_API_URL (e.g.
// https://example.com/api) in .env.local. When set, it is the only address
// used - the dev-machine guessing above is skipped.
const PRODUCTION_API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '')
  .trim()
  .replace(/\/+$/, '');

// Whether a backend server exists at all: a deployed one, or the dev
// machine's during development. The live web app has none.
export const HAS_BACKEND = Boolean(PRODUCTION_API_URL) || __DEV__;

export const API_BASE_URL_CANDIDATES = PRODUCTION_API_URL
  ? [PRODUCTION_API_URL]
  : HAS_BACKEND
    ? candidateHosts().map((host) => `http://${host}:3001/api`)
    : [];

const BACKEND_TIMEOUT_MS = 20000;

// POSTs JSON to the backend, trying each candidate address in turn until one
// answers. Only a failure to *connect* moves on to the next address; any HTTP
// response (even an error status) is returned as-is, so a request is never
// sent twice to a server that received it.
export async function postToBackend(
  path: string,
  body: unknown,
): Promise<{ ok: boolean; data: any }> {
  let lastError: unknown;
  for (const baseUrl of API_BASE_URL_CANDIDATES) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));
      return { ok: response.ok, data };
    } catch (error) {
      lastError = error;
      console.warn(`Backend unreachable at ${baseUrl}, trying next...`);
    } finally {
      clearTimeout(timeoutId);
    }
  }
  throw lastError ?? new Error('No backend address configured');
}
