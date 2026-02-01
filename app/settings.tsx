import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { user, signOut } = useAuth();
  
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [darkMode, setDarkMode] = useState(isDark);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#000' : '#fff',
    },
    header: {
      padding: 20,
      paddingTop: 40,
      backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa',
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: isDark ? '#888' : '#666',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      marginBottom: 16,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa',
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingIcon: {
      fontSize: 24,
      marginRight: 16,
      color: '#007AFF',
    },
    settingText: {
      fontSize: 16,
      color: isDark ? '#fff' : '#000',
    },
    settingDescription: {
      fontSize: 14,
      color: isDark ? '#888' : '#666',
      marginTop: 4,
    },
    actionButton: {
      backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa',
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    dangerButton: {
      backgroundColor: '#FF3B30',
    },
    buttonText: {
      fontSize: 16,
      color: isDark ? '#fff' : '#000',
      marginLeft: 16,
      flex: 1,
    },
    dangerButtonText: {
      fontSize: 16,
      color: '#fff',
      marginLeft: 16,
      flex: 1,
    },
    profileCard: {
      backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa',
      padding: 20,
      borderRadius: 12,
      marginBottom: 24,
      alignItems: 'center',
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#007AFF',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    avatarText: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#fff',
    },
    profileName: {
      fontSize: 20,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      marginBottom: 4,
    },
    profileEmail: {
      fontSize: 16,
      color: isDark ? '#888' : '#666',
    },
    backButton: {
      position: 'absolute',
      top: 40,
      left: 20,
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#2a2a2a' : '#e9ecef',
    },
  });

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/login');
            } catch (error) {
              console.error('Sign out error:', error);
            }
          },
        },
      ]
    );
  };

  const getInitials = (name: string, email: string) => {
    if (name) {
      return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.split('@')[0].toUpperCase().slice(0, 2);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your app preferences</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitials(user?.displayName || '', user?.email || '')}
            </Text>
          </View>
          <Text style={styles.profileName}>{user?.displayName || 'User'}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications" style={styles.settingIcon} />
              <View>
                <Text style={styles.settingText}>Push Notifications</Text>
                <Text style={styles.settingDescription}>Receive hazard alerts and updates</Text>
              </View>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: isDark ? '#444' : '#e0e0e0', true: '#007AFF' }}
              thumbColor={notifications ? '#fff' : isDark ? '#888' : '#666'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="location" style={styles.settingIcon} />
              <View>
                <Text style={styles.settingText}>Location Services</Text>
                <Text style={styles.settingDescription}>Allow app to access your location</Text>
              </View>
            </View>
            <Switch
              value={locationServices}
              onValueChange={setLocationServices}
              trackColor={{ false: isDark ? '#444' : '#e0e0e0', true: '#007AFF' }}
              thumbColor={locationServices ? '#fff' : isDark ? '#888' : '#666'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon" style={styles.settingIcon} />
              <View>
                <Text style={styles.settingText}>Dark Mode</Text>
                <Text style={styles.settingDescription}>Use dark theme</Text>
              </View>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: isDark ? '#444' : '#e0e0e0', true: '#007AFF' }}
              thumbColor={darkMode ? '#fff' : isDark ? '#888' : '#666'}
            />
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="person" style={styles.settingIcon} />
            <Text style={styles.buttonText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#888' : '#666'} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => router.push('/dashboard')}
          >
            <Ionicons name="document-text" style={styles.settingIcon} />
            <Text style={styles.buttonText}>My Reports</Text>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#888' : '#666'} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => router.push('/forgot-password')}
          >
            <Ionicons name="key" style={styles.settingIcon} />
            <Text style={styles.buttonText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#888' : '#666'} />
          </TouchableOpacity>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="help-circle" style={styles.settingIcon} />
            <Text style={styles.buttonText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#888' : '#666'} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="shield-checkmark" style={styles.settingIcon} />
            <Text style={styles.buttonText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#888' : '#666'} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="document-text" style={styles.settingIcon} />
            <Text style={styles.buttonText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#888' : '#666'} />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.dangerButton]} 
            onPress={handleSignOut}
          >
            <Ionicons name="log-out" size={24} color="#fff" />
            <Text style={styles.dangerButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
