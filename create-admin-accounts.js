// Firebase Admin Account Creation Script
// This script creates admin accounts for specified government agencies

// Since we're in a React Native environment, we'll create a simpler approach
// that can be run in the browser console or adapted for Node.js

const adminAccounts = [
  {
    email: 'ocd-admin@hazard.gov.ph',
    password: 'OCD@Hazard2024!',
    displayName: 'OCD Administrator',
    role: 'admin',
    agency: 'Office of Civil Defense',
    agencyCode: 'OCD'
  },
  {
    email: 'dswd-admin@hazard.gov.ph',
    password: 'DSWD@Hazard2024!',
    displayName: 'DSWD Administrator',
    role: 'admin',
    agency: 'Department of Social Welfare and Development',
    agencyCode: 'DSWD'
  },
  {
    email: 'bfp-admin@hazard.gov.ph',
    password: 'BFP@Hazard2024!',
    displayName: 'BFP Administrator',
    role: 'admin',
    agency: 'Bureau of Fire Protection',
    agencyCode: 'BFP'
  },
  {
    email: 'pnp-admin@hazard.gov.ph',
    password: 'PNP@Hazard2024!',
    displayName: 'PNP Administrator',
    role: 'admin',
    agency: 'Philippine National Police',
    agencyCode: 'PNP'
  },
  {
    email: 'redcross-admin@hazard.gov.ph',
    password: 'RedCross@Hazard2024!',
    displayName: 'Red Cross Administrator',
    role: 'admin',
    agency: 'Philippine Red Cross',
    agencyCode: 'REDCROSS'
  },
  {
    email: 'doh-admin@hazard.gov.ph',
    password: 'DOH@Hazard2024!',
    displayName: 'DOH Administrator',
    role: 'admin',
    agency: 'Department of Health',
    agencyCode: 'DOH'
  },
  {
    email: 'dilg-admin@hazard.gov.ph',
    password: 'DILG@Hazard2024!',
    displayName: 'DILG Administrator',
    role: 'admin',
    agency: 'Department of the Interior and Local Government',
    agencyCode: 'DILG'
  }
];

const superAdminAccount = {
  email: 'ndrrmc-admin@hazard.gov.ph',
  password: 'NDRRMC@Hazard2024!',
  displayName: 'NDRRMC Administrator',
  role: 'super_admin',
  agency: 'National Disaster Risk Reduction and Management Council',
  agencyCode: 'NDRRMC'
};

console.log(' Admin Account Creation Script');
console.log('=====================================\n');

console.log(' Regular Admin Accounts (7):');
adminAccounts.forEach((admin, index) => {
  console.log(`${index + 1}. ${admin.agencyCode}`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Password: ${admin.password}`);
  console.log(`   Agency: ${admin.agency}`);
  console.log('');
});

console.log(' Super Admin Account (1):');
console.log(`1. ${superAdminAccount.agencyCode}`);
console.log(`   Email: ${superAdminAccount.email}`);
console.log(`   Password: ${superAdminAccount.password}`);
console.log(`   Agency: ${superAdminAccount.agency}`);
console.log('');

console.log(' Instructions:');
console.log('1. Use the Firebase Console to create these accounts manually');
console.log('2. Or use the Firebase Admin SDK to create them programmatically');
console.log('3. Each account needs a user document in Firestore with the following structure:');
console.log('');

console.log('User Document Structure:');
console.log(JSON.stringify({
  uid: "user-uid",
  email: "agency-admin@hazard.gov.ph",
  displayName: "Agency Administrator",
  role: "admin", // or "super_admin"
  agency: "Full Agency Name",
  agencyCode: "AGENCY_CODE",
  isActive: true,
  createdAt: "timestamp",
  lastLogin: "timestamp",
  permissions: ["hazard_reports", "analytics"] // for admin
}, null, 2));

console.log('\n Ready to create admin accounts!');
