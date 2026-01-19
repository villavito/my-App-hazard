import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';

export default function UserDashboard() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { user, userRole } = useAuth();

  // Debug: Log what data we're getting
  console.log('Dashboard - User object:', user);
  console.log('Dashboard - UserRole object:', userRole);
  console.log('Dashboard - User email:', user?.email);
  console.log('Dashboard - UserRole email:', userRole?.email);
  console.log('Dashboard - UserRole displayName:', userRole?.displayName);

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
    welcomeText: {
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
      fontSize: 20,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      marginBottom: 16,
    },
    card: {
      backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa',
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    cardIcon: {
      fontSize: 24,
      marginRight: 16,
      color: '#007AFF',
    },
    cardContent: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      marginBottom: 4,
    },
    cardDescription: {
      fontSize: 14,
      color: isDark ? '#888' : '#666',
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    statCard: {
      backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa',
      padding: 16,
      borderRadius: 12,
      flex: 1,
      marginHorizontal: 4,
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#007AFF',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 14,
      color: isDark ? '#888' : '#666',
      textAlign: 'center',
    },
    logoutButton: {
      backgroundColor: '#FF3B30',
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 20,
    },
    logoutButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '600',
    },
    profileCard: {
      backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa',
      padding: 20,
      borderRadius: 12,
      marginBottom: 24,
    },
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: isDark ? '#4a4a4a' : '#dee2e6',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    avatarText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      marginBottom: 4,
    },
    profileEmail: {
      fontSize: 14,
      color: isDark ? '#888' : '#666',
      marginBottom: 4,
    },
    profileRole: {
      fontSize: 14,
      color: '#007AFF',
      fontWeight: '500',
    },
    profileButton: {
      padding: 8,
      borderRadius: 6,
      backgroundColor: isDark ? '#3a3a3a' : '#e9ecef',
    },
    myReportsButton: {
      backgroundColor: '#007AFF',
    },
  });

  const handleLogout = async () => {
    // TODO: Implement logout logic
    router.push('/login');
  };

  const features: {
    icon: string;
    title: string;
    description: string;
  }[] = [
    {
      icon: 'camera-outline',
      title: 'Capture the Hazard',
      description: 'Report and document safety hazards',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>
            Welcome, {userRole?.displayName || 'User'}!
          </Text>
          <Text style={styles.subtitle}>{user?.email || userRole?.email || 'Your dashboard'}</Text>
        </View>

        <View style={styles.content}>
          {/* User Profile Section */}
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(userRole?.displayName || 'User').split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{userRole?.displayName || 'Welcome User'}</Text>
                <Text style={styles.profileEmail}>{user?.email || userRole?.email || 'No email available'}</Text>
                <Text style={styles.profileRole}>{userRole?.role?.replace('_', ' ') || 'user'}</Text>
              </View>
              <TouchableOpacity 
                style={styles.profileButton} 
                onPress={() => router.push('/profile')}
              >
                <Ionicons name="settings-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Reports</Text>
            <TouchableOpacity 
              style={[styles.card, styles.myReportsButton]} 
              onPress={() => router.push('/my-reports')}
            >
              <Ionicons name="document-text-outline" size={24} style={styles.cardIcon} />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>View My Reports</Text>
                <Text style={styles.cardDescription}>Check status of your submitted hazard reports</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            {features.map((feature, index) => (
              <TouchableOpacity key={index} style={styles.card} onPress={() => router.push('/capture-hazard')}>
                <Ionicons name={feature.icon as keyof typeof Ionicons.glyphMap} size={24} style={styles.cardIcon} />
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{feature.title}</Text>
                  <Text style={styles.cardDescription}>{feature.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

