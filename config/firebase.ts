import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBxFSpEKq5Fv7vRyHaY7_G9MeoaA-mppNE",
  authDomain: "thehazard-5f87e.firebaseapp.com",
  projectId: "thehazard-5f87e",
  storageBucket: "thehazard-5f87e.firebasestorage.app",
  messagingSenderId: "364711835242",
  appId: "1:364711835242:web:efeeb73cee5e41aa007c13",
  measurementId: "G-1WXP5HPNBZ"
};

// Initialize Firebase
let app: any = null;
let auth: any = null;
let db: any = null;

// Initialize Firebase on first use
const initializeFirebase = () => {
  if (!app) {
    try {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Firebase initialization error:', error);
      throw error;
    }
  }
  return { app, auth, db };
};

// Lazy initialization functions
export const getFirebaseAuth = () => {
  if (!auth) {
    initializeFirebase();
  }
  return auth;
};

export const getFirebaseDB = () => {
  if (!db) {
    initializeFirebase();
  }
  return db;
};

export const getFirebaseApp = () => {
  if (!app) {
    initializeFirebase();
  }
  return app;
};

// For backward compatibility - these will initialize Firebase when accessed
export { auth, db };
export default app;