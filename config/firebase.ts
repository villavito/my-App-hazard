// Firebase configuration for Expo
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig: any = {
  apiKey: "AIzaSyCMz8fLrVUG-ujxt1SSjiN537p_yCMQnPg",
  authDomain: "thehazard-75651.firebaseapp.com",
  databaseURL: "https://thehazard-75651-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "thehazard-75651",
  storageBucket: "thehazard-75651.firebasestorage.app",
  messagingSenderId: "203788333932",
  appId: "1:203788333932:web:3e4794421129e0f73d3949",
  measurementId: "G-E3CBCE8VXV"
};

// Initialize Firebase
let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;

// Lazy initialization function
const initializeFirebase = () => {
  if (!app) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    console.log('🔥 Firebase initialized for Expo');
    console.log('📱 Auth ready');
    console.log('🗄️ Firestore ready');
    console.log('💾 Storage ready');
  }
  return { app, auth, db, storage };
};

// Initialize on first import
const { app: initializedApp, auth: initializedAuth, db: initializedDb } = initializeFirebase();
app = initializedApp;
auth = initializedAuth;
db = initializedDb;

// Initialize storage separately
storage = getStorage(app);

// Export Firebase services
export { app, auth, db, storage };
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

export const getFirebaseStorage = () => {
  if (!storage) {
    initializeFirebase();
  }
  return storage;
};

export default app;
