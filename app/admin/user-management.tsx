import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../contexts/AuthContext';

interface User {
  id: string;
  name: string;
  email: string;
  lastActive?: string;
  status?: 'active' | 'inactive';
}

export default function UserManagement() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { user } = useAuth();
  const isWeb = Platform.OS === 'web';

  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Mock data - replace with actual Firebase calls
  useEffect(() => {
    const mockUsers: User[] = [
      { id: 'USR001', name: 'John Doe', email: 'john.doe@example.com', lastActive: '2 hours ago', status: 'active' },
      { id: 'USR002', name: 'Jane Smith', email: 'jane.smith@example.com', lastActive: '1 day ago', status: 'active' },
      { id: 'USR003', name: 'Bob Johnson', email: 'bob.johnson@example.com', lastActive: '3 days ago', status: 'inactive' },
      { id: 'USR004', name: 'Alice Brown', email: 'alice.brown@example.com', lastActive: '5 minutes ago', status: 'active' },
      { id: 'USR005', name: 'Charlie Wilson', email: 'charlie.wilson@example.com', lastActive: '1 week ago', status: 'inactive' },
    ];

    setTimeout(() => {
      setUsers(mockUsers);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.id.toLowerCase().includes(searchQuery.toLowerCase())
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
    searchContainer: {
      marginBottom: 20,
    },
    searchInput: {
      backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#e0e0e0',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: isDark ? '#fff' : '#000',
    },
    statsContainer: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 24,
    },
    statCard: {
      backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
      padding: 16,
      borderRadius: 8,
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
      color: isDark ? '#888' : '#666',
      textAlign: 'center',
    },
    tableContainer: {
      backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
      borderRadius: 8,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : '#e0e0e0',
    },
    tableHeaderText: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : '#e0e0e0',
    },
    tableRowLast: {
      borderBottomWidth: 0,
    },
    tableCell: {
      fontSize: 14,
      color: isDark ? '#fff' : '#000',
    },
    userIdCell: {
      flex: 0.8,
      fontWeight: '500',
    },
    nameCell: {
      flex: 1.2,
    },
    emailCell: {
      flex: 1.5,
    },
    statusCell: {
      flex: 0.8,
      alignItems: 'flex-end',
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
      backgroundColor: '#FF3B30',
    },
    statusText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
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
  });

  const UserManagementContent = () => (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>User Management</Text>
          <Text style={styles.headerSubtitle}>View user logs and account information</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by ID, name, or email..."
            placeholderTextColor={isDark ? '#888' : '#666'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{users.length}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{users.filter(u => u.status === 'active').length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{users.filter(u => u.status === 'inactive').length}</Text>
            <Text style={styles.statLabel}>Inactive</Text>
          </View>
        </View>

        {/* User Table */}
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.userIdCell]}>User ID</Text>
            <Text style={[styles.tableHeaderText, styles.nameCell]}>Name</Text>
            <Text style={[styles.tableHeaderText, styles.emailCell]}>Email</Text>
            <Text style={[styles.tableHeaderText, styles.statusCell]}>Status</Text>
          </View>

          {/* Table Rows */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading users...</Text>
            </View>
          ) : filteredUsers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No users found matching your search.' : 'No users available.'}
              </Text>
            </View>
          ) : (
            filteredUsers.map((user, index) => (
              <View 
                key={user.id} 
                style={[
                  styles.tableRow,
                  index === filteredUsers.length - 1 && styles.tableRowLast
                ]}
              >
                <Text style={[styles.tableCell, styles.userIdCell]}>{user.id}</Text>
                <Text style={[styles.tableCell, styles.nameCell]}>{user.name}</Text>
                <Text style={[styles.tableCell, styles.emailCell]}>{user.email}</Text>
                <View style={styles.statusCell}>
                  <View style={[
                    styles.statusBadge,
                    user.status === 'active' ? styles.statusActive : styles.statusInactive
                  ]}>
                    <Text style={styles.statusText}>
                      {user.status?.toUpperCase() || 'ACTIVE'}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );

  if (isWeb) {
    return (
      <AdminLayout title="User Management" userRole="admin">
        <UserManagementContent />
      </AdminLayout>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#000' : '#fff' }}>
      <UserManagementContent />
    </SafeAreaView>
  );
}
