const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCJgfoIbGkAKTya1MX7ho670fi-fFbFVlo",
  authDomain: "incident-4a5a6.firebaseapp.com",
  projectId: "incident-4a5a6",
  storageBucket: "incident-4a5a6.firebasestorage.app",
  messagingSenderId: "833458585716",
  appId: "1:833458585716:web:f65978e5ee2e0f2ff35121",
  measurementId: "G-C4BHGRV4CB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Sample data for setup
const sampleUsers = [
  {
    uid: "admin_sample_123",
    email: "admin@incident.com",
    displayName: "Admin User",
    role: "admin",
    createdAt: new Date(),
    lastLogin: new Date()
  },
  {
    uid: "super_admin_sample_456",
    email: "superadmin@incident.com", 
    displayName: "Super Admin",
    role: "super_admin",
    createdAt: new Date(),
    lastLogin: new Date()
  },
  {
    uid: "user_sample_789",
    email: "user@incident.com",
    displayName: "Regular User",
    role: "user",
    createdAt: new Date(),
    lastLogin: new Date()
  }
];

const sampleIncidents = [
  {
    id: "incident_sample_1",
    userId: "user_sample_789",
    userEmail: "user@incident.com",
    imageUrl: "https://example.com/incident1.jpg",
    description: "Pothole on main road causing traffic incident",
    location: "Zamboanga City",
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "incident_sample_2", 
    userId: "user_sample_789",
    userEmail: "user@incident.com",
    imageUrl: "https://example.com/incident2.jpg",
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
    
    // Create sample incidents
    console.log("Creating sample incidents...");
    for (const incident of sampleIncidents) {
      await setDoc(doc(db, "incidents", incident.id), incident);
      console.log(`✅ Created incident: ${incident.description}`);
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
    console.log("└── incidents/");
    console.log("    ├── {incidentId}");
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
