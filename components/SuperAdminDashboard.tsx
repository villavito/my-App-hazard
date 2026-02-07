import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
}

interface IncidentReport {
  id: string;
  user: {
    name: string;
    email: string;
    uid: string;
  };
  description: string;
  image: string | null;
  location: any;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes: string | null;
}

const { width } = Dimensions.get('window');

const SuperAdminDashboard: React.FC = () => {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [incidentReports, setIncidentReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load admin users from localStorage
      const localUsers = localStorage.getItem('hazard_local_users');
      if (localUsers) {
        const users = JSON.parse(localUsers);
        const admins = users.filter((u: any) => u.role === 'admin' || u.role === 'super_admin');
        setAdminUsers(admins);
      }

      // Load incident reports from localStorage
      const reports = localStorage.getItem('incident_reports');
      if (reports) {
        setIncidentReports(JSON.parse(reports));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAdminStats = () => {
    const activeAdmins = adminUsers.filter(admin => admin.isActive).length;
    const totalAdmins = adminUsers.length;
    const inactiveAdmins = totalAdmins - activeAdmins;
    return { activeAdmins, inactiveAdmins, totalAdmins };
  };

  const getReportStats = () => {
    const pendingReports = incidentReports.filter(report => report.status === 'pending').length;
    const totalReports = incidentReports.length;
    const approvedReports = incidentReports.filter(report => report.status === 'approved').length;
    const rejectedReports = incidentReports.filter(report => report.status === 'rejected').length;
    return { pendingReports, totalReports, approvedReports, rejectedReports };
  };

  const toggleAdminStatus = (adminId: string, currentStatus: boolean) => {
    setAdminUsers(prev => 
      prev.map(admin => 
        admin.id === adminId 
          ? { ...admin, isActive: !currentStatus }
          : admin
      )
    );
  };

  const deleteAdmin = (adminId: string) => {
    setAdminUsers(prev => prev.filter(admin => admin.id !== adminId));
  };

  const updateReportStatus = (reportId: string, newStatus: 'approved' | 'rejected') => {
    setIncidentReports(prev => 
      prev.map(report => 
        report.id === reportId 
          ? { ...report, status: newStatus }
          : report
      )
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
    },
    header: {
      backgroundColor: '#007AFF',
      padding: 20,
      paddingTop: 40,
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: '#fff',
      opacity: 0.8,
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
      color: '#000',
      marginBottom: 16,
    },
    statsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24,
    },
    statCard: {
      backgroundColor: '#fff',
      padding: 16,
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
      fontSize: 24,
      fontWeight: 'bold',
      color: '#007AFF',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: '#666',
      textAlign: 'center',
    },
    card: {
      backgroundColor: '#fff',
      padding: 20,
      borderRadius: 12,
      marginBottom: 16,
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
      fontSize: 28,
      marginRight: 16,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: '#000',
    },
    cardDescription: {
      fontSize: 16,
      color: '#666',
      lineHeight: 24,
      marginBottom: 16,
    },
    cardAction: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: '#f0f0f0',
    },
    cardActionText: {
      fontSize: 16,
      fontWeight: '600',
    },
    adminCard: {
      backgroundColor: '#fff',
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
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
      color: '#000',
      marginBottom: 4,
    },
    adminEmail: {
      fontSize: 14,
      color: '#666',
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
      marginTop: 12,
    },
    actionButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      alignItems: 'center',
      flex: 1,
    },
    toggleButton: {
      backgroundColor: '#f0f0f0',
    },
    toggleButtonText: {
      fontSize: 12,
      color: '#000',
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
      borderRadius: 12,
      alignSelf: 'flex-start',
    },
    statusActive: {
      backgroundColor: '#34C759',
    },
    statusInactive: {
      backgroundColor: '#FF9800',
    },
    statusPending: {
      backgroundColor: '#FF9500',
    },
    statusApproved: {
      backgroundColor: '#34C759',
    },
    statusRejected: {
      backgroundColor: '#FF3B30',
    },
    statusText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '600',
    },
    reportCard: {
      backgroundColor: '#fff',
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    reportHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    reportInfo: {
      flex: 1,
    },
    reportUser: {
      fontSize: 16,
      fontWeight: '600',
      color: '#000',
      marginBottom: 4,
    },
    reportDescription: {
      fontSize: 14,
      color: '#666',
      marginBottom: 8,
      lineHeight: 20,
    },
    reportMeta: {
      fontSize: 12,
      color: '#888',
    },
    reportActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    approveButton: {
      backgroundColor: '#34C759',
    },
    rejectButton: {
      backgroundColor: '#FF3B30',
    },
    actionButtonText: {
      fontSize: 12,
      color: '#fff',
      fontWeight: '500',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: '#666',
    },
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Super Admin Dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Super Admin Dashboard</Text>
        <Text style={styles.subtitle}>Manage system administration</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Admin Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admin Statistics</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{getAdminStats().totalAdmins}</Text>
              <Text style={styles.statLabel}>Total Admins</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{getAdminStats().activeAdmins}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{getAdminStats().inactiveAdmins}</Text>
              <Text style={styles.statLabel}>Inactive</Text>
            </View>
          </View>
        </View>

        {/* Report Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Statistics</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{getReportStats().totalReports}</Text>
              <Text style={styles.statLabel}>Total Reports</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{getReportStats().pendingReports}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{getReportStats().approvedReports}</Text>
              <Text style={styles.statLabel}>Approved</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>⏳</Text>
              <Text style={styles.cardTitle}>Pending Reports</Text>
            </View>
            <Text style={styles.cardDescription}>View and manage pending hazard reports that require attention</Text>
            <View style={styles.cardAction}>
              <Text style={styles.cardActionText}>View Reports</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card}>
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

        {/* Recent Admin Users */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Admin Users</Text>
          {adminUsers.slice(0, 3).map((admin) => (
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
                  onPress={() => deleteAdmin(admin.id)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Recent Reports */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Reports</Text>
          {incidentReports.slice(0, 3).map((report) => (
            <View key={report.id} style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <View style={styles.reportInfo}>
                  <Text style={styles.reportUser}>{report.user.name}</Text>
                  <Text style={styles.reportDescription}>{report.description.substring(0, 100)}...</Text>
                  <Text style={styles.reportMeta}>{new Date(report.timestamp).toLocaleDateString()}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  report.status === 'pending' ? styles.statusPending :
                  report.status === 'approved' ? styles.statusApproved : styles.statusRejected
                ]}>
                  <Text style={styles.statusText}>
                    {report.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              
              {report.status === 'pending' && (
                <View style={styles.reportActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => updateReportStatus(report.id, 'approved')}
                  >
                    <Text style={styles.actionButtonText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => updateReportStatus(report.id, 'rejected')}
                  >
                    <Text style={styles.actionButtonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default SuperAdminDashboard;
