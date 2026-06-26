import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AGENCIES, AGENCY_COLORS, AGENCY_LABELS } from '../../constants/agencies';
import { useAuth } from '../../contexts/AuthContext';
import { signOutUser } from '../../services/authService';
import { getAgencyIncidentCounts, getAllUsers } from '../../services/firestoreService';

export default function SuperAdminDashboard() {
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
    superAdminBadge: {
      backgroundColor: '#FF3B30',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 8,
    },
    superAdminBadgeText: {
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
    agencyCard: {
      borderLeftWidth: 4,
      marginBottom: 10,
    },
    agencyCount: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#007AFF',
      marginRight: 12,
      minWidth: 28,
      textAlign: 'center',
    },
  });

  const [totalUsers, setTotalUsers] = useState(0);
  const [adminCount, setAdminCount] = useState(0);
  const [agencyCounts, setAgencyCounts] = useState<Record<string, number>>({
    PNP: 0,
    BFP: 0,
    RHU: 0,
    BDRRMC: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      const [usersResult, countsResult] = await Promise.all([
        getAllUsers(),
        getAgencyIncidentCounts(),
      ]);

      if (usersResult.success && usersResult.data) {
        setTotalUsers(usersResult.data.length);
        setAdminCount(
          usersResult.data.filter((user: any) => user.role === 'admin' || user.role === 'super_admin').length
        );
      }

      if (countsResult.success && countsResult.data) {
        setAgencyCounts(countsResult.data);
      }
    };

    loadStats();
  }, []);

  const handleLogout = async () => {
    await signOutUser();
    router.replace('/login');
  };

  const superAdminFeatures = [
    {
      icon: 'people-outline',
      title: 'User Management',
      description: 'Manage all users and roles',
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Incident Reports',
      description: 'View all agency incident reports',
      route: '/admin/incidents',
    },
    {
      icon: 'lock-closed-outline',
      title: 'System Security',
      description: 'Configure security settings',
    },
    {
      icon: 'analytics-outline',
      title: 'System Analytics',
      description: 'View comprehensive system analytics',
    },
    {
      icon: 'server-outline',
      title: 'System Configuration',
      description: 'Configure system-wide settings',
    },
    {
      icon: 'notifications-outline',
      title: 'Global Alerts',
      description: 'Manage system-wide notifications',
    },
    {
      icon: 'document-text-outline',
      title: 'System Reports',
      description: 'Generate system reports',
    },
    {
      icon: 'key-outline',
      title: 'API Management',
      description: 'Manage API keys and access',
    },
    {
      icon: 'build-outline',
      title: 'System Maintenance',
      description: 'System maintenance tools',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>
            Super Admin Dashboard
          </Text>
          <Text style={styles.subtitle}>{userRole?.displayName || 'Super Admin'}</Text>
          <View style={styles.superAdminBadge}>
            <Text style={styles.superAdminBadgeText}>SUPER ADMIN</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{totalUsers}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{adminCount}</Text>
              <Text style={styles.statLabel}>Admins</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {Object.values(agencyCounts).reduce((sum, count) => sum + count, 0)}
              </Text>
              <Text style={styles.statLabel}>Reports</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Agency Reports</Text>
            {AGENCIES.map((agency) => (
              <TouchableOpacity
                key={agency}
                style={[styles.card, styles.agencyCard, { borderLeftColor: AGENCY_COLORS[agency] }]}
                onPress={() => router.push({ pathname: '/admin/incidents', params: { agency } })}
              >
                <Text style={styles.agencyCount}>{agencyCounts[agency] ?? 0}</Text>
                <Ionicons name="shield-outline" size={24} style={styles.cardIcon} />
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{agency}</Text>
                  <Text style={styles.cardDescription}>{AGENCY_LABELS[agency]}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={isDark ? '#888' : '#666'} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Management</Text>
            {superAdminFeatures.map((feature, index) => (
              <TouchableOpacity
                key={index}
                style={styles.card}
                onPress={() => feature.route && router.push(feature.route as any)}
              >
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
