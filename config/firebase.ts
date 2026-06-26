import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth/react-native';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCJgfoIbGkAKTya1MX7ho670fi-fFbFVlo',
  authDomain: 'incident-4a5a6.firebaseapp.com',
  projectId: 'incident-4a5a6',
  storageBucket: 'incident-4a5a6.firebasestorage.app',
  messagingSenderId: '833458585716',
  appId: '1:833458585716:web:f65978e5ee2e0f2ff35121',
  measurementId: 'G-C4BHGRV4CB',
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (!message.toLowerCase().includes('already')) {
    throw error;
  }
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);

export default app;
