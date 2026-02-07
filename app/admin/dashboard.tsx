import { useRouter } from 'expo-router';
import { Platform, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdminOnlyLayout from '../../components/AdminOnlyLayout';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminDashboard() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { userRole } = useAuth();

  const isWeb = Platform.OS === 'web';

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 24,
      gap: 16,
    },
    statCard: {
      backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
      padding: 24,
      borderRadius: 12,
      flex: 1,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    statNumber: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#007AFF',
      marginBottom: 8,
    },
    statLabel: {
      fontSize: 14,
      color: isDark ? '#888' : '#666',
      textAlign: 'center',
      fontWeight: '500',
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      marginBottom: 16,
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    card: {
      backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
      padding: 20,
      borderRadius: 12,
      marginBottom: 16,
      flex: isWeb ? 1 : undefined,
      minWidth: isWeb ? 250 : undefined,
      maxWidth: isWeb ? 400 : undefined,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    cardIcon: {
      fontSize: 24,
      marginRight: 16,
      color: '#007AFF',
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
    },
    cardDescription: {
      fontSize: 14,
      color: isDark ? '#888' : '#666',
      lineHeight: 20,
    },
    quickActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
    },
    actionButton: {
      backgroundColor: '#007AFF',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: 'center',
      flex: 1,
    },
    actionButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    secondaryButton: {
      backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0',
    },
    secondaryButtonText: {
      color: isDark ? '#fff' : '#000',
    },
    emptyDashboard: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 100,
    },
    emptyText: {
      fontSize: 24,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtext: {
      fontSize: 16,
      color: isDark ? '#888' : '#666',
      textAlign: 'center',
    },
  });

  const adminFeatures: Array<{
    icon: string;
    title: string;
    description: string;
    action: string;
    route: string;
  }> = [];

  const DashboardContent = () => (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Empty Dashboard - No content, no stats, no tools */}
        <View style={styles.emptyDashboard}>
          <Text style={styles.emptyText}>Admin Dashboard</Text>
          <Text style={styles.emptySubtext}>No content available</Text>
        </View>
      </ScrollView>
    </View>
  );

  if (isWeb) {
    return (
      <AdminOnlyLayout title="Admin Dashboard" userRole="admin">
        <DashboardContent />
      </AdminOnlyLayout>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#000' : '#fff' }}>
      <DashboardContent />
    </SafeAreaView>
  );
}
