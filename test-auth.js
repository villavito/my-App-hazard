// Test script to verify Firebase auth is working
console.log('Testing Firebase Auth...');

// Test if Firebase is properly initialized
try {
  const { getFirebaseAuth } = require('./config/firebase');
  const auth = getFirebaseAuth();
  console.log('✅ Firebase Auth initialized successfully:', auth);
} catch (error) {
  console.error('❌ Firebase Auth initialization failed:', error);
}

// Test if auth service functions are available
try {
  const { createUserWithRole, signInUser } = require('./services/authService');
  console.log('✅ Auth service functions loaded successfully');
  console.log('Available functions:', {
    createUserWithRole: typeof createUserWithRole,
    signInUser: typeof signInUser
  });
} catch (error) {
  console.error('❌ Auth service loading failed:', error);
}

console.log('Auth test completed!');
