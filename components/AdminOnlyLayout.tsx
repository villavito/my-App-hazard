import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  userRole: 'admin';
}

const { width } = Dimensions.get('window');

export default function AdminLayout({ children, title, userRole }: AdminLayoutProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isWeb = Platform.OS === 'web';

  const adminMenuItems = [
    {
      id: 'dashboard',
      title: 'Admin Dashboard',
      icon: 'grid-outline',
      route: '/admin/dashboard'
    }
  ];

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#0a0a0a' : '#f5f5f5',
      flexDirection: 'row',
    },
    sidebar: {
      width: isWeb ? (sidebarCollapsed ? 60 : 200) : '100%',
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      borderRightWidth: isWeb ? 1 : 0,
      borderRightColor: isDark ? '#333' : '#e0e0e0',
      flexDirection: 'column',
      position: 'relative',
      flexShrink: 0,
    },
    sidebarHeader: {
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : '#e0e0e0',
      alignItems: 'center',
    },
    logo: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#007AFF',
      marginBottom: 5,
    },
    collapsedProfile: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
    },
    profileSection: {
      alignItems: 'center',
      paddingVertical: 15,
    },
    profileGrid: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 10,
    },
    profileIconContainer: {
      marginRight: 12,
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      marginBottom: 2,
    },
    profileRole: {
      fontSize: 11,
      color: isDark ? '#888' : '#666',
      fontWeight: '500',
      marginBottom: 2,
    },
    profileEmail: {
      fontSize: 10,
      color: isDark ? '#888' : '#666',
    },
    userSection: {
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : '#e0e0e0',
    },
    userInfo: {
      alignItems: 'center',
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      marginBottom: 4,
    },
    userEmail: {
      fontSize: 12,
      color: isDark ? '#888' : '#666',
    },
    roleBadge: {
      backgroundColor: '#007AFF',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      marginTop: 8,
    },
    roleBadgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '600',
    },
    menuContainer: {
      flex: 1,
      paddingVertical: 15,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 15,
      marginHorizontal: 8,
      marginVertical: 2,
      borderRadius: 8,
    },
    menuItemActive: {
      backgroundColor: isDark ? '#007AFF20' : '#007AFF10',
      borderLeftWidth: 3,
      borderLeftColor: '#007AFF',
    },
    menuIcon: {
      fontSize: 18,
      color: isDark ? '#fff' : '#000',
      marginRight: 12,
      minWidth: 18,
    },
    menuText: {
      fontSize: 13,
      color: isDark ? '#fff' : '#000',
      fontWeight: '500',
    },
    menuTextCollapsed: {
      display: 'none',
    },
    mainContent: {
      flex: 1,
      flexDirection: 'column',
      minWidth: 0,
    },
    header: {
      backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : '#e0e0e0',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    headerButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    toggleButton: {
      position: 'absolute',
      left: '50%',
      top: -5,
      transform: [{ translateX: -15 }],
      width: 30,
      height: 30,
      borderRadius: 4,
      backgroundColor: '#007AFF',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 5,
    },
    toggleIcon: {
      fontSize: 14,
      color: '#fff',
      fontWeight: 'bold',
    },
    logoutButton: {
      backgroundColor: '#FF3B30',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    logoutText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
  });

  if (!isWeb) {
    // Mobile layout - just render children directly
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <View style={styles.sidebar}>
        {/* Toggle Button */}
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          <Ionicons 
            name={sidebarCollapsed ? 'menu-outline' : 'close-outline'} 
            style={styles.toggleIcon}
          />
        </TouchableOpacity>

        {/* Profile Section */}
        <View style={styles.sidebarHeader}>
          {sidebarCollapsed ? (
            <View style={styles.collapsedProfile}>
              <Ionicons name="person-circle-outline" size={24} color={isDark ? '#fff' : '#000'} />
            </View>
          ) : (
            <View style={styles.profileGrid}>
              <View style={styles.profileIconContainer}>
                <Ionicons name="person-circle-outline" size={28} color={isDark ? '#fff' : '#000'} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.displayName || 'Admin'}</Text>
                <Text style={styles.profileRole}>Admin</Text>
                <Text style={styles.profileEmail}>{user?.email}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {adminMenuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                title === item.title && styles.menuItemActive
              ]}
              onPress={() => router.push(item.route)}
            >
              <Ionicons 
                name={item.icon as keyof typeof Ionicons.glyphMap} 
                style={styles.menuIcon}
              />
              {!sidebarCollapsed && (
                <Text style={styles.menuText}>{item.title}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        {!sidebarCollapsed && (
          <View style={{ padding: 20 }}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={16} color="#fff" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="notifications-outline" size={20} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="person-outline" size={20} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {children}
        </View>
      </View>
    </View>
  );
}
