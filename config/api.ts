import Constants from 'expo-constants';
import { Platform } from 'react-native';

// The backend (backend/server.js) runs on the dev machine at port 3001.
// Expo's dev server already knows the dev machine's LAN IP (it's how the
// phone/emulator loaded this JS bundle in the first place) and exposes it as
// hostUri - reusing that means a physical device on the same Wi-Fi reaches
// the backend too, not just emulators/simulators/web on the same machine.
function resolveDevHost(): string {
  const hostUri: string | undefined =
    Constants.expoConfig?.hostUri ??
    (Constants as unknown as { expoGoConfig?: { hostUri?: string } })
      .expoGoConfig?.hostUri;

  const host = hostUri?.split(':')[0];
  if (host) return host;

  // No dev server host available (e.g. a standalone build). Fall back to the
  // loopback aliases, which only work for an emulator/simulator/web target.
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
}

export const API_BASE_URL = `http://${resolveDevHost()}:3001/api`;
