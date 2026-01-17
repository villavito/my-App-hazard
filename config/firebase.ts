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
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;