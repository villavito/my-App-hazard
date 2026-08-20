import Constants from 'expo-constants';
import { Platform } from 'react-native';

// TEMPORARY: a public tunnel (`npx cloudflared tunnel --url http://localhost:3001`)
// to the dev machine's backend, for testing on a phone whose Wi-Fi/hotspot
// isolates clients from each other so the LAN candidates below can never
// work no matter how correctly the dev machine is configured. This URL dies
// when the tunnel process is stopped or the terminal running it closes -
// when that happens, either start a new tunnel and update this constant, or
// clear it back to '' once the device is back on a real shared network.
const TUNNEL_URL = 'https://cabinets-respect-surge-equivalent.trycloudflare.com/api';

// The backend (backend/server.js) runs on the dev machine at port 3001.
// There's no single host alias that reaches it from every dev target - a
// physical device needs the PC's actual LAN IP, a standard Android Studio
// emulator needs 10.0.2.2, Genymotion needs 10.0.3.2, and a browser/iOS
// simulator needs localhost - so instead of guessing one, every candidate
// is exposed and callers that need reliability (e.g. video upload) should
// try them in order until one connects.
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

export const API_BASE_URL_CANDIDATES = [
  ...(TUNNEL_URL ? [TUNNEL_URL] : []),
  ...candidateHosts().map((host) => `http://${host}:3001/api`),
];

// Kept for call sites where a single best-guess URL is fine (e.g.
// best-effort requests already wrapped in try/catch).
export const API_BASE_URL = API_BASE_URL_CANDIDATES[0];
