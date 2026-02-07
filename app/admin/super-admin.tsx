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
  const [incidentReports, setIncidentReports] = useState<any[]>([]);
  const [userMessages, setUserMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load admin users
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

      // Load incident reports from localStorage
      const reports = localStorage.getItem('incident_reports');
      if (reports) {
        setIncidentReports(JSON.parse(reports));
      }

      // Load user messages from localStorage
      const messages = localStorage.getItem('user_notifications');
      if (messages) {
        setUserMessages(JSON.parse(messages));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to localStorage for admin users
      const localUsers = localStorage.getItem('hazard_local_users');
      if (localUsers) {
        const users = JSON.parse(localUsers);
        const admins = users.filter((u: any) => u.role === 'admin' || u.role === 'super_admin');
        setAdminUsers(admins);
      }
      
      // Fallback for incident reports
      const reports = localStorage.getItem('incident_reports');
      if (reports) {
        setIncidentReports(JSON.parse(reports));
      }

      // Fallback for user messages
      const messages = localStorage.getItem('user_notifications');
      if (messages) {
        setUserMessages(JSON.parse(messages));
      }
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

  const getReportStats = () => {
    // Fixed status values based on actual usage in the app
    const approvedReports = incidentReports.filter(report => report.status === 'reviewed').length;
    const declinedReports = incidentReports.filter(report => report.status === 'declined' || report.status === 'resolved').length;
    const totalReports = incidentReports.length;
    const pendingReports = incidentReports.filter(report => report.status === 'pending').length;
    
    return { approvedReports, declinedReports, totalReports, pendingReports };
  };

  const deleteMessage = async (messageId: string) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Get all messages from localStorage
              const allMessages = JSON.parse(localStorage.getItem('user_notifications') || '[]');
              
              // Remove the message
              const updatedMessages = allMessages.filter((msg: any) => msg.id !== messageId);
              
              // Save back to localStorage
              localStorage.setItem('user_notifications', JSON.stringify(updatedMessages));
              
              // Update local state
              setUserMessages(updatedMessages);
              
              Alert.alert('Success', 'Message deleted successfully');
            } catch (error) {
              console.error('Error deleting message:', error);
              Alert.alert('Error', 'Failed to delete message');
            }
          }
        }
      ]
    );
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

        {/* Pending Reports Card */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.pendingReportsCard}
            onPress={() => router.push('/admin/pending-reports')}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>⏳</Text>
              <Text style={styles.cardTitle}>Pending Reports</Text>
            </View>
            <Text style={styles.cardDescription}>View and manage pending hazard reports that require attention</Text>
            <View style={styles.cardAction}>
              <Text style={styles.cardActionText}>View Reports</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* View Admins Card */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.viewAdminsCard}
            onPress={() => router.push('/admin/user-management')}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>👥</Text>
              <Text style={styles.cardTitle}>View Admins</Text>
            </View>
            <Text style={styles.cardDescription}>Manage and monitor all admin accounts across different agencies</Text>
            <View style={styles.cardAction}>
              <Text style={styles.cardActionText}>Manage Admins</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Pending Report History Card */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.reportHistoryCard}
            onPress={() => router.push('/admin/report-history')}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>📋</Text>
              <Text style={styles.cardTitle}>Report History</Text>
            </View>
            <Text style={styles.cardDescription}>View all approved and declined reports history and decisions made by admins</Text>
            <View style={styles.cardAction}>
              <Text style={styles.cardActionText}>View History</Text>
            </View>
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
    pendingReportsCard: {
      backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
      padding: 24,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#e0e0e0',
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    cardIcon: {
      fontSize: 28,
      marginRight: 16,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
    },
    cardDescription: {
      fontSize: 16,
      color: isDark ? '#888' : '#666',
      lineHeight: 24,
      marginBottom: 16,
    },
    cardAction: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#333' : '#f0f0f0',
    },
    cardActionText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cardArrow: {
      fontSize: 18,
      color: '#007AFF',
      fontWeight: 'bold',
    },
    viewAdminsCard: {
      backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
      padding: 24,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#e0e0e0',
    },
    reportHistoryCard: {
      backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
      padding: 24,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#e0e0e0',
    },
    userReportsButton: {
      backgroundColor: 'rgba(227, 232, 237, 1)',
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      width: '14%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    userReportsButtonText: {
      fontSize: 18,
      fontWeight: '100',
      
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
    reportStatsCard: {
      backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
      padding: 24,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#e0e0e0',
    },
    approvedStat: {
      color: '#34C759',
    },
    declinedStat: {
      color: '#FF3B30',
    },
    pendingStat: {
      color: '#FF9500',
    },
    messagesCard: {
      backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
      padding: 24,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#e0e0e0',
    },
    messagesList: {
      marginTop: 16,
    },
    emptyMessages: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    emptyMessagesText: {
      fontSize: 16,
      color: isDark ? '#888' : '#666',
      fontStyle: 'italic',
    },
    messageItem: {
      backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa',
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
    },
    messageHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    messageTo: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
    },
    messageDate: {
      fontSize: 12,
      color: isDark ? '#888' : '#666',
    },
    messagePreview: {
      fontSize: 14,
      color: isDark ? '#ccc' : '#666',
      lineHeight: 20,
      marginBottom: 8,
    },
    deleteMessageButton: {
      alignSelf: 'flex-start',
      backgroundColor: '#FF3B30',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 4,
    },
    deleteMessageButtonText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    messagesFooter: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#333' : '#e0e0e0',
    },
    messagesCount: {
      fontSize: 14,
      color: isDark ? '#888' : '#666',
      textAlign: 'center',
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
