import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminDashboard() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { user, userRole } = useAuth();

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
    adminBadge: {
      backgroundColor: '#007AFF',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 8,
    },
    adminBadgeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
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
  });

  const handleLogout = async () => {
    // TODO: Implement logout logic
    router.push('/login');
  };

  const adminFeatures = [
    {
      icon: 'people-outline',
      title: 'User Management',
      description: 'Manage user accounts and permissions',
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Hazard Reports',
      description: 'Review and manage hazard reports',
    },
    {
      icon: 'analytics-outline',
      title: 'Analytics',
      description: 'View system analytics and reports',
    },
    {
      icon: 'notifications-outline',
      title: 'Alert Management',
      description: 'Configure and manage safety alerts',
    },
    {
      icon: 'settings-outline',
      title: 'System Settings',
      description: 'Configure system parameters',
    },
    {
      icon: 'document-text-outline',
      title: 'Reports',
      description: 'Generate and view reports',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>
            Admin Dashboard
          </Text>
          <Text style={styles.subtitle}>{userRole?.displayName || 'Admin'}</Text>
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>ADMIN</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>
                        <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Reports</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Tools</Text>
            {adminFeatures.map((feature, index) => (
              <TouchableOpacity key={index} style={styles.card}>
                <Ionicons name={feature.icon as keyof typeof Ionicons.glyphMap} size={24} style={styles.cardIcon} />
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{feature.title}</Text>
                  <Text style={styles.cardDescription}>{feature.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <TouchableOpacity style={styles.card} onPress={() => router.push('/profile')}>
              <Ionicons name="person" size={24} style={styles.cardIcon} />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Profile</Text>
                <Text style={styles.cardDescription}>Manage your profile information</Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
