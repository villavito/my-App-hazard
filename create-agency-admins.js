// Create Agency Admin Accounts Script
// This script creates admin accounts for PNP, Red Cross, BFP, and DOH

// Initialize localStorage if not available
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    data: {},
    getItem: function(key) { return this.data[key] || null; },
    setItem: function(key, value) { this.data[key] = value; },
    removeItem: function(key) { delete this.data[key]; }
  };
}

// Get existing users
const getUsers = () => {
  try {
    const users = localStorage.getItem('hazard_local_users');
    return users ? JSON.parse(users) : [];
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};

// Save users
const saveUsers = (users) => {
  try {
    localStorage.setItem('hazard_local_users', JSON.stringify(users));
  } catch (error) {
    console.error('Error saving users:', error);
  }
};

// Generate unique ID
const generateUid = () => {
  return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Agency admin accounts to create
const agencyAdmins = [
  {
    email: 'pnp-admin@hazard.local',
    displayName: 'PNP Admin',
    password: 'PNPAdmin123!',
    role: 'admin',
    agency: 'Philippine National Police',
    agencyCode: 'PNP'
  },
  {
    email: 'redcross-admin@hazard.local',
    displayName: 'Red Cross Admin',
    password: 'RedCross123!',
    role: 'admin',
    agency: 'Philippine Red Cross',
    agencyCode: 'RED_CROSS'
  },
  {
    email: 'bfp-admin@hazard.local',
    displayName: 'BFP Admin',
    password: 'BFPAdmin123!',
    role: 'admin',
    agency: 'Bureau of Fire Protection',
    agencyCode: 'BFP'
  },
  {
    email: 'doh-admin@hazard.local',
    displayName: 'DOH Admin',
    password: 'DOHAdmin123!',
    role: 'admin',
    agency: 'Department of Health',
    agencyCode: 'DOH'
  }
];

// Create agency admin accounts
const createAgencyAdmins = () => {
  console.log('🔥 Creating agency admin accounts...');
  
  const users = getUsers();
  let createdCount = 0;
  
  agencyAdmins.forEach(adminData => {
    // Check if user already exists
    if (users.find(u => u.email.toLowerCase() === adminData.email.toLowerCase())) {
      console.log(`⚠️  Admin account already exists: ${adminData.email}`);
      return;
    }
    
    // Create new admin user
    const newAdmin = {
      uid: generateUid(),
      email: adminData.email.toLowerCase(),
      displayName: adminData.displayName,
      password: adminData.password,
      role: adminData.role,
      agency: adminData.agency,
      agencyCode: adminData.agencyCode,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      isActive: true
    };
    
    users.push(newAdmin);
    createdCount++;
    console.log(`✅ Created admin account: ${adminData.email}`);
  });
  
  saveUsers(users);
  console.log(`\n🎉 Successfully created ${createdCount} agency admin accounts!`);
  
  // Display created credentials
  console.log('\n📋 Agency Admin Credentials:');
  console.log('================================');
  agencyAdmins.forEach(admin => {
    console.log(`🏢 ${admin.agency}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${admin.password}`);
    console.log(`   Agency Code: ${admin.agencyCode}`);
    console.log('');
  });
};

// Run the script
createAgencyAdmins();
