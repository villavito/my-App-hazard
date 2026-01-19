import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { user, userRole } = useAuth();
  const [displayName, setDisplayName] = useState(userRole?.displayName || '');
  const [isLoading, setIsLoading] = useState(false);

  // Debug: Log user object to see what's available
  console.log('User object:', user);
  console.log('User email:', user?.email);
  console.log('UserRole object:', userRole);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#000' : '#fff',
    },
    header: {
      padding: 20,
      paddingTop: 40,
      backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    backButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#2a2a2a' : '#e9ecef',
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    profileSection: {
      backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa',
      padding: 20,
      borderRadius: 12,
      marginBottom: 24,
    },
    profileHeader: {
      alignItems: 'center',
      marginBottom: 24,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: isDark ? '#4a4a4a' : '#dee2e6',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    avatarText: {
      fontSize: 32,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
    },
    email: {
      fontSize: 16,
      color: isDark ? '#888' : '#666',
      marginBottom: 4,
    },
    role: {
      fontSize: 14,
      color: isDark ? '#aaa' : '#888',
      textTransform: 'capitalize',
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      marginBottom: 8,
    },
    input: {
      backgroundColor: isDark ? '#3a3a3a' : '#fff',
      borderWidth: 1,
      borderColor: isDark ? '#4a4a4a' : '#dee2e6',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: isDark ? '#fff' : '#000',
    },
    saveButton: {
      backgroundColor: '#007AFF',
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 24,
    },
    saveButtonDisabled: {
      backgroundColor: isDark ? '#3a3a3a' : '#e9ecef',
    },
    saveButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    infoCard: {
      backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa',
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    infoLabel: {
      fontSize: 14,
      color: isDark ? '#888' : '#666',
    },
    infoValue: {
      fontSize: 14,
      color: isDark ? '#fff' : '#000',
      fontWeight: '500',
    },
  });

  const handleSaveProfile = async () => {
    console.log('Save profile button clicked!');
    console.log('User object:', user);
    console.log('User UID:', user?.uid);
    console.log('Current display name:', displayName);
    
    if (!user || !displayName.trim()) {
      console.log('Validation failed: No user or empty display name');
      Alert.alert('Error', 'Please enter a valid name');
      return;
    }

    console.log('Validation passed, proceeding with update...');
    setIsLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      console.log('User ref:', userRef);
      
      await updateDoc(userRef, {
        displayName: displayName.trim(),
      });

      console.log('Update successful!');
      Alert.alert('Success', 'Profile updated successfully!');
      router.back();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      Alert.alert('Error', `Failed to update profile: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(displayName || user?.email || 'U')}
              </Text>
            </View>
            <Text style={styles.email}>{user?.email || userRole?.email || 'No email'}</Text>
            <Text style={styles.role}>{userRole?.role?.replace('_', ' ') || 'user'}</Text>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Enter your name"
            placeholderTextColor={isDark ? '#888' : '#999'}
          />
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>User ID</Text>
            <Text style={styles.infoValue}>{user?.uid?.slice(0, 8)}...</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>{userRole?.role?.replace('_', ' ') || 'user'}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            (!displayName.trim() || isLoading) && styles.saveButtonDisabled
          ]}
          onPress={handleSaveProfile}
          disabled={!displayName.trim() || isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Saving...' : 'Save Profile'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

