// Script to create a test user in Firebase
const { getAuth } = require('firebase/auth');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBxFSpEKq5Fv7vRyHaY7_G9MeoaA-mppNE",
  authDomain: "thehazard-5f87e.firebaseapp.com",
  projectId: "thehazard-5f87e",
  storageBucket: "thehazard-5f87e.firebasestorage.app",
  messagingSenderId: "364711835242",
  appId: "1:364711835242:web:efeeb73cee5e41aa007c13",
  measurementId: "G-1WXP5HPNBZ"
};

async function createTestUser() {
  try {
    console.log('Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log('Test user creation script ready');
    console.log('To create a test user, use the signup functionality in the app');
    console.log('Or create users manually in Firebase Console');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createTestUser();
