const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Firebase configuration
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
const db = getFirestore(app);
const auth = getAuth(app);

// Sample data for setup
const sampleUsers = [
  {
    uid: "admin_sample_123",
    email: "admin@hazard.com",
    displayName: "Admin User",
    role: "admin",
    createdAt: new Date(),
    lastLogin: new Date()
  },
  {
    uid: "super_admin_sample_456",
    email: "superadmin@hazard.com", 
    displayName: "Super Admin",
    role: "super_admin",
    createdAt: new Date(),
    lastLogin: new Date()
  },
  {
    uid: "user_sample_789",
    email: "user@hazard.com",
    displayName: "Regular User",
    role: "user",
    createdAt: new Date(),
    lastLogin: new Date()
  }
];

const sampleHazards = [
  {
    id: "hazard_sample_1",
    userId: "user_sample_789",
    userEmail: "user@hazard.com",
    imageUrl: "https://example.com/hazard1.jpg",
    description: "Pothole on main road causing traffic hazard",
    location: "Zamboanga City",
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "hazard_sample_2", 
    userId: "user_sample_789",
    userEmail: "user@hazard.com",
    imageUrl: "https://example.com/hazard2.jpg",
    description: "Broken street light in residential area",
    location: "Ayala",
    status: "resolved",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function setupFirestore() {
  console.log("Setting up Firestore database...");
  
  try {
    // Create sample users
    console.log("Creating sample users...");
    for (const user of sampleUsers) {
      await setDoc(doc(db, "users", user.uid), user);
      console.log(`✅ Created user: ${user.email}`);
    }
    
    // Create sample hazards
    console.log("Creating sample hazards...");
    for (const hazard of sampleHazards) {
      await setDoc(doc(db, "hazards", hazard.id), hazard);
      console.log(`✅ Created hazard: ${hazard.description}`);
    }
    
    console.log("🎉 Firestore setup completed successfully!");
    console.log("\n📊 Database Structure:");
    console.log("├── users/");
    console.log("│   ├── {userId}");
    console.log("│   │   ├── uid: string");
    console.log("│   │   ├── email: string");
    console.log("│   │   ├── displayName: string");
    console.log("│   │   ├── role: 'user' | 'admin' | 'super_admin'");
    console.log("│   │   ├── createdAt: timestamp");
    console.log("│   │   └── lastLogin: timestamp");
    console.log("└── hazards/");
    console.log("    ├── {hazardId}");
    console.log("    │   ├── id: string");
    console.log("    │   ├── userId: string");
    console.log("    │   ├── userEmail: string");
    console.log("    │   ├── imageUrl: string");
    console.log("    │   ├── description: string");
    console.log("    │   ├── location: string");
    console.log("    │   ├── status: 'pending' | 'in_progress' | 'resolved'");
    console.log("    │   ├── createdAt: timestamp");
    console.log("    │   └── updatedAt: timestamp");
    
  } catch (error) {
    console.error("❌ Error setting up Firestore:", error);
  }
}

// Run the setup
setupFirestore();
