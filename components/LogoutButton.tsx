import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
// import { signOut, auth } from '../config/firebase';

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    
    try {
      // Firebase logout logic - uncomment after installing Firebase
      // await signOut(auth);
      console.log('User logged out');
      
      // Navigate to landing page after logout
      router.push('/landing');
    } catch (error: any) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.logoutButton, loading && styles.disabledButton]} 
      onPress={handleLogout}
      disabled={loading}
    >
      <Text style={styles.logoutButtonText}>
        {loading ? 'Logging Out...' : 'Logout'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
