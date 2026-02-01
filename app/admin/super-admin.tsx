import { useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../contexts/AuthContext';
import { getFirebaseDB } from '../../services/firestoreService';

interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  agency: string;
  agencyCode: string;
  isActive: boolean;
  createdAt: any;
  lastLogin: any;
  permissions: string[];
}

export default function SuperAdminDashboard() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { user } = useAuth();

  const isWeb = Platform.OS === 'web';

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminUsers();
  }, []);

  const loadAdminUsers = async () => {
    try {
      const db = getFirebaseDB();
      const usersQuery = query(
        collection(db, 'users'),
        where('role', 'in', ['admin', 'super_admin'])
      );
      const snapshot = await getDocs(usersQuery);
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        email: doc.data().email || '',
        displayName: doc.data().displayName || '',
        role: doc.data().role || '',
        agency: doc.data().agency || '',
        agencyCode: doc.data().agencyCode || '',
        isActive: doc.data().isActive ?? true,
        createdAt: doc.data().createdAt || null,
        lastLogin: doc.data().lastLogin || null,
        permissions: doc.data().permissions || []
      } as AdminUser));
      setAdminUsers(users);
    } catch (error) {
      console.error('Error loading admin users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const db = getFirebaseDB();
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isActive: !currentStatus,
        updatedAt: new Date()
      });
      
      // Update local state
      setAdminUsers(prev => 
        prev.map(admin => 
          admin.id === userId 
            ? { ...admin, isActive: !currentStatus }
            : admin
        )
      );
      
      Alert.alert(
        'Success',
        `Admin account ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      );
    } catch (error) {
      console.error('Error toggling admin status:', error);
      Alert.alert('Error', 'Failed to update admin status');
    }
  };

  const deleteAdmin = async (userId: string, email: string) => {
    Alert.alert(
      'Delete Admin',
      `Are you sure you want to delete the admin account for ${email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = getFirebaseDB();
              await deleteDoc(doc(db, 'users', userId));
              
              setAdminUsers(prev => prev.filter(admin => admin.id !== userId));
              Alert.alert('Success', 'Admin account deleted successfully');
            } catch (error) {
              console.error('Error deleting admin:', error);
              Alert.alert('Error', 'Failed to delete admin account');
            }
          }
        }
      ]
    );
  };

  const getAdminStats = () => {
    const activeAdmins = adminUsers.filter(admin => admin.isActive).length;
    const totalAdmins = adminUsers.length;
    const inactiveAdmins = totalAdmins - activeAdmins;
    return { activeAdmins, inactiveAdmins, totalAdmins };
  };

  const superAdminFeatures = [
    {
      id: 'security',
      title: 'System Security',
      description: 'Configure security settings',
      action: 'Security Settings',
      route: '/admin/user-management'
    },
    {
      id: 'analytics',
      title: 'System Analytics',
      description: 'View comprehensive system analytics',
      action: 'View Analytics',
      route: '/admin/incident-reports'
    },
    {
      id: 'system',
      title: 'System Configuration',
      description: 'Configure system-wide settings',
      action: 'System Config',
      route: '/admin/dashboard'
    },
    {
      id: 'notifications',
      title: 'Global Alerts',
      description: 'Manage system-wide notifications',
      action: 'Manage Alerts',
      route: '/admin/dashboard'
    },
    {
      id: 'reports',
      title: 'System Reports',
      description: 'Generate system reports',
      action: 'Generate Reports',
      route: '/admin/incident-reports'
    },
    {
      id: 'api',
      title: 'API Management',
      description: 'Manage API keys and access',
      action: 'API Settings',
      route: '/admin/dashboard'
    },
    {
      id: 'maintenance',
      title: 'System Maintenance',
      description: 'System maintenance tools',
      action: 'Maintenance Tools',
      route: '/admin/dashboard'
    },
  ];

  const getIconName = (featureId: string) => {
    switch (featureId) {
      case 'security': return 'shield-checkmark';
      case 'analytics': return 'bar-chart-outline';
      case 'system': return 'settings-outline';
      case 'notifications': return 'notifications-outline';
      case 'reports': return 'document-text-outline';
      case 'api': return 'key-outline';
      case 'maintenance': return 'build-outline';
      default: 'help-circle-outline';
    }
  };

  const SuperAdminContent = () => (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Super Admin Dashboard</Text>
        </View>

        {/* User Reports Button */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.userReportsButton}
            onPress={() => router.push('/admin/pending-reports')}
          >
            <Text style={styles.userReportsButtonText}>⏳ View Pending Reports</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      marginBottom: 24,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
      marginBottom: 8,
    },
    headerSubtitle: {
      fontSize: 16,
      color: isDark ? '#888' : '#666',
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
    activeStat: {
      color: '#4CAF50',
    },
    inactiveStat: {
      color: '#FF9800',
    },
    totalStat: {
      color: '#007AFF',
    },
    section: {
      marginBottom: 32,
    },
    userReportsButton: {
      backgroundColor: '#007AFF',
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    userReportsButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '600',
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      marginBottom: 16,
    },
    adminGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 20,
      justifyContent: 'center',
      alignItems: 'stretch',
    },
    adminCard: {
      backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
      padding: 20,
      borderRadius: 12,
      marginBottom: 0,
      flex: isWeb ? 1 : undefined,
      minWidth: isWeb ? 280 : undefined,
      maxWidth: isWeb ? 350 : undefined,
      width: isWeb ? undefined : undefined,
      minHeight: isWeb ? 200 : undefined,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      display: 'flex',
      flexDirection: 'column',
    },
    adminHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    adminInfo: {
      flex: 1,
    },
    adminName: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      marginBottom: 4,
    },
    adminEmail: {
      fontSize: 14,
      color: isDark ? '#888' : '#666',
      marginBottom: 4,
    },
    adminAgency: {
      fontSize: 14,
      color: '#007AFF',
      fontWeight: '500',
    },
    adminActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 'auto',
      paddingTop: 8,
    },
    actionButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      alignItems: 'center',
      flex: 1,
    },
    toggleButton: {
      backgroundColor: isDark ? '#1a1a1a' : '#f0f0f0',
    },
    toggleButtonText: {
      fontSize: 12,
      color: isDark ? '#fff' : '#000',
      fontWeight: '500',
    },
    deleteButton: {
      backgroundColor: '#FF3B30',
    },
    deleteButtonText: {
      fontSize: 12,
      color: '#fff',
      fontWeight: '500',
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      alignSelf: 'flex-start',
    },
    statusActive: {
      backgroundColor: '#4CAF5020',
      color: '#4CAF50',
    },
    statusInactive: {
      backgroundColor: '#FF980020',
      color: '#FF9800',
    },
    statusText: {
      fontSize: 10,
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: isDark ? '#888' : '#666',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      color: isDark ? '#888' : '#666',
      textAlign: 'center',
    },
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
      justifyContent: 'flex-start',
      alignItems: 'stretch',
    },
    card: {
      backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
      padding: 20,
      borderRadius: 12,
      marginBottom: 0,
      flex: isWeb ? 1 : undefined,
      minWidth: isWeb ? 200 : undefined,
      maxWidth: isWeb ? 250 : undefined,
      minHeight: isWeb ? 160 : undefined,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      display: 'flex',
      flexDirection: 'column',
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    cardIcon: {
      fontSize: 24,
      marginRight: 16,
      color: '#FF3B30',
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
      gap: 8,
      marginTop: 12,
    },
    actionButtonText: {
      fontSize: 14,
      color: '#fff',
      fontWeight: '600',
    },
  });

  const renderAdminCard = (admin: AdminUser) => (
    <View key={admin.id} style={styles.adminCard}>
      <View style={styles.adminHeader}>
        <View style={styles.adminInfo}>
          <Text style={styles.adminName}>{admin.displayName}</Text>
          <Text style={styles.adminEmail}>{admin.email}</Text>
          <Text style={styles.adminAgency}>{admin.agency}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          admin.isActive ? styles.statusActive : styles.statusInactive
        ]}>
          <Text style={styles.statusText}>
            {admin.isActive ? 'ACTIVE' : 'INACTIVE'}
          </Text>
        </View>
      </View>
      
      <View style={styles.adminActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.toggleButton]}
          onPress={() => toggleAdminStatus(admin.id, admin.isActive)}
        >
          <Text style={styles.toggleButtonText}>
            {admin.isActive ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deleteAdmin(admin.id, admin.email)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isWeb) {
    return (
      <AdminLayout title="Super Admin Dashboard" userRole="super_admin">
        <SuperAdminContent />
      </AdminLayout>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#000' : '#fff' }}>
      <SuperAdminContent />
    </SafeAreaView>
  );
}
