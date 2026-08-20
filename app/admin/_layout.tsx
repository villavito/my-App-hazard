import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AGENCIES, AGENCY_COLORS } from "../../constants/agencies";
import { useAuth } from "../../contexts/AuthContext";
import { signOutUser } from "../../services/authService";
import { getIncidentsByAgency } from "../../services/firestoreService";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.75;

const INBOX_AGENCIES = AGENCIES;

type NavItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route?: string;
  badge?: string;
  children?: { label: string; route: string }[];
};

export default function AdminLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, userRole } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Mirrors the scoping in admin/incidents.tsx: only super admins count every
  // agency. An admin with no agency assigned counts nothing rather than
  // everything, so the badge can't leak another agency's volume.
  const restrictedAgency = userRole?.agency;
  const visibleAgencies = userRole?.role === "super_admin"
    ? INBOX_AGENCIES
    : restrictedAgency
      ? [restrictedAgency]
      : [];

  useEffect(() => {
    // Querying before Firebase Auth has restored the session fails Firestore's
    // isAdmin() rule check (request.auth is briefly null), so wait for it.
    if (!user) return;

    const checkPending = () => {
      Promise.all(visibleAgencies.map((agency) => getIncidentsByAgency(agency))).then(
        (results) => {
          const count = results
            .filter((result) => result.success && result.data)
            .flatMap((result) => result.data as any[])
            .filter((i) => (i.status || "pending") === "pending").length;
          setPendingCount(count);
        }
      );
    };

    checkPending();
    const interval = setInterval(checkPending, 30000);
    return () => clearInterval(interval);
  }, [JSON.stringify(visibleAgencies), user]);

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label],
    );
  };

  const isSuperAdmin = userRole?.role === "super_admin";

  const mainNavItems: NavItem[] = [
    { icon: "grid-outline", label: "Dashboard", route: "/admin/dashboard" },
    {
      icon: "file-tray-full-outline",
      label: "Notifications",
      route: "/admin/incidents",
      badge: pendingCount > 0 ? String(pendingCount) : undefined,
    },
    { icon: "person-outline", label: "Profile", route: "/profile" },
  ];

  const handleNavigation = (route?: string) => {
    if (route) {
      router.push(route as any);
    }
    setSidebarOpen(false);
  };

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    await signOutUser();
    router.replace("/login");
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#0a0a0f" : "#f0f2f5",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: insets.top + 8,
      paddingBottom: 12,
      backgroundColor: isDark ? "#1a1a2e" : "#ffffff",
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#2a2a4e" : "#e0e0e0",
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    menuButton: {
      padding: 8,
      borderRadius: 8,
    },
    bellButton: {
      padding: 8,
      borderRadius: 8,
      marginRight: 4,
    },
    bellBadge: {
      position: "absolute",
      top: 2,
      right: 2,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      paddingHorizontal: 3,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#FF3B30",
      borderWidth: 1,
      borderColor: isDark ? "#1a1a2e" : "#ffffff",
    },
    bellBadgeText: {
      color: "#fff",
      fontSize: 9,
      fontWeight: "700",
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: "700",
      color: isDark ? "#fff" : "#1a1a2e",
      marginLeft: 12,
    },
    profileButton: {
      padding: 4,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: "#007AFF",
    },
    profileAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "#007AFF",
      alignItems: "center",
      justifyContent: "center",
    },
    profileAvatarText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "700",
    },
    dropdownOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 998,
    },
    dropdown: {
      position: "absolute",
      top: insets.top + 60,
      right: 16,
      backgroundColor: isDark ? "#1a1a2e" : "#ffffff",
      borderRadius: 12,
      padding: 8,
      minWidth: 200,
      elevation: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? "#2a2a4e" : "#e0e0e0",
      zIndex: 999,
    },
    dropdownItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderRadius: 8,
    },
    dropdownItemText: {
      fontSize: 14,
      color: isDark ? "#fff" : "#333",
      marginLeft: 12,
    },
    dropdownDivider: {
      height: 1,
      backgroundColor: isDark ? "#2a2a4e" : "#e0e0e0",
      marginVertical: 4,
    },
    dropdownDanger: {
      color: "#FF3B30",
    },
    sidebarOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      zIndex: 100,
    },
    sidebar: {
      position: "absolute",
      top: 0,
      left: 0,
      bottom: 0,
      width: SIDEBAR_WIDTH,
      backgroundColor: isDark ? "#12121f" : "#ffffff",
      zIndex: 101,
      elevation: 16,
      shadowColor: "#000",
      shadowOffset: { width: 4, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
    },
    sidebarHeader: {
      padding: 20,
      paddingTop: insets.top + 20,
      backgroundColor: isDark ? "#1a1a2e" : "#f8f9fa",
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#2a2a4e" : "#e0e0e0",
    },
    sidebarBrand: {
      flexDirection: "row",
      alignItems: "center",
    },
    sidebarLogo: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: "#007AFF",
      alignItems: "center",
      justifyContent: "center",
    },
    sidebarBrandText: {
      fontSize: 18,
      fontWeight: "700",
      color: isDark ? "#fff" : "#1a1a2e",
      marginLeft: 12,
    },
    sidebarUserInfo: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? "#2a2a4e" : "#e0e0e0",
    },
    sidebarUserName: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#fff" : "#333",
    },
    sidebarUserRole: {
      fontSize: 12,
      color: isDark ? "#888" : "#666",
      marginTop: 2,
    },
    sidebarBadge: {
      backgroundColor: isSuperAdmin ? "#FF3B30" : "#007AFF",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      alignSelf: "flex-start",
      marginTop: 4,
    },
    sidebarBadgeText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "700",
    },
    sidebarNav: {
      flex: 1,
      paddingVertical: 8,
    },
    navItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 20,
    },
    navItemActive: {
      backgroundColor: isDark ? "#1a1a3e" : "#e8f0fe",
      borderLeftWidth: 3,
      borderLeftColor: "#007AFF",
    },
    navIcon: {
      width: 24,
      textAlign: "center",
      marginRight: 14,
    },
    navLabel: {
      flex: 1,
      fontSize: 15,
      color: isDark ? "#ddd" : "#444",
      fontWeight: "500",
    },
    navLabelActive: {
      color: "#007AFF",
      fontWeight: "700",
    },
    navBadge: {
      backgroundColor: "#FF3B30",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      minWidth: 22,
      alignItems: "center",
    },
    navBadgeText: {
      color: "#fff",
      fontSize: 11,
      fontWeight: "700",
    },
    navArrow: {
      marginLeft: 8,
    },
    childItem: {
      paddingLeft: 58,
      paddingVertical: 10,
    },
    childLabel: {
      fontSize: 14,
      color: isDark ? "#aaa" : "#666",
    },
    childLabelActive: {
      color: "#007AFF",
      fontWeight: "600",
    },
    sidebarFooter: {
      padding: 20,
      paddingBottom: insets.bottom + 20,
      borderTopWidth: 1,
      borderTopColor: isDark ? "#2a2a4e" : "#e0e0e0",
    },
    sidebarFooterItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
    },
    sidebarFooterText: {
      fontSize: 14,
      color: isDark ? "#aaa" : "#666",
      marginLeft: 12,
    },
    agencyIndicator: {
      flexDirection: "row",
      marginTop: 8,
      gap: 4,
    },
    agencyDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
  });

  const renderNavItem = (item: NavItem, index: number) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.label);

    return (
      <View key={index}>
        <TouchableOpacity
          style={[styles.navItem, false && styles.navItemActive]}
          onPress={() => {
            if (hasChildren) {
              toggleMenu(item.label);
            } else {
              handleNavigation(item.route);
            }
          }}
        >
          <Ionicons
            name={item.icon}
            size={20}
            color={"#007AFF"}
            style={styles.navIcon}
          />
          <Text style={[styles.navLabel, false && styles.navLabelActive]}>
            {item.label}
          </Text>
          {item.badge && (
            <View style={styles.navBadge}>
              <Text style={styles.navBadgeText}>{item.badge}</Text>
            </View>
          )}
          {hasChildren && (
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={16}
              color={isDark ? "#888" : "#999"}
              style={styles.navArrow}
            />
          )}
        </TouchableOpacity>
        {hasChildren && isExpanded && (
          <View>
            {item.children!.map((child, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.childItem}
                onPress={() => handleNavigation(child.route)}
              >
                <Text
                  style={[styles.childLabel, false && styles.childLabelActive]}
                >
                  {child.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setSidebarOpen(true)}
        >
          <Ionicons
            name="menu-outline"
            size={24}
            color={isDark ? "#fff" : "#333"}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Dashbord</Text>
        <TouchableOpacity
          style={styles.bellButton}
          onPress={() => router.push("/admin/incidents")}
        >
          <Ionicons
            name="notifications-outline"
            size={22}
            color={isDark ? "#fff" : "#333"}
          />
          {pendingCount > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>
                {pendingCount > 99 ? "99+" : pendingCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => setProfileDropdownOpen(!profileDropdownOpen)}
        >
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {user?.email?.[0]?.toUpperCase() || "A"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Profile Dropdown */}
      {profileDropdownOpen && (
        <>
          <Pressable
            style={styles.dropdownOverlay}
            onPress={() => setProfileDropdownOpen(false)}
          />
          <View style={styles.dropdown}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setProfileDropdownOpen(false);
                router.push("/profile");
              }}
            >
              <Ionicons name="person-outline" size={18} color="#007AFF" />
              <Text style={styles.dropdownItemText}>My Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={18} color="#FF3B30" />
              <Text style={[styles.dropdownItemText, styles.dropdownDanger]}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Sidebar */}
      {sidebarOpen && (
        <>
          <Pressable
            style={styles.sidebarOverlay}
            onPress={() => setSidebarOpen(false)}
          />
          <View style={styles.sidebar}>
            {/* Brand Section */}
            <View style={styles.sidebarHeader}>
              <View style={styles.sidebarBrand}>
                <View style={styles.sidebarLogo}>
                  <Ionicons name="shield" size={22} color="#fff" />
                </View>
                <Text style={styles.sidebarBrandText}>Incident</Text>
              </View>
              <View style={styles.sidebarUserInfo}>
                <Text style={styles.sidebarUserName}>
                  {userRole?.displayName || "Admin User"}
                </Text>
                <Text style={styles.sidebarUserRole}>{user?.email || ""}</Text>
                <View style={styles.sidebarBadge}>
                  <Text style={styles.sidebarBadgeText}>
                    {isSuperAdmin
                      ? "SUPER ADMIN"
                      : restrictedAgency
                        ? `${restrictedAgency} ADMIN`
                        : "ADMIN"}
                  </Text>
                </View>
              </View>
              {/* Agency Colors Indicator - only the admin's own agency, unless unrestricted */}
              <View style={styles.agencyIndicator}>
                {visibleAgencies.map((agency) => (
                  <View
                    key={agency}
                    style={[
                      styles.agencyDot,
                      { backgroundColor: AGENCY_COLORS[agency] },
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Navigation */}
            <ScrollView
              style={styles.sidebarNav}
              showsVerticalScrollIndicator={false}
            >
              {mainNavItems.map((item, index) => renderNavItem(item, index))}
            </ScrollView>

            {/* Footer */}
            <View style={styles.sidebarFooter}>
              <TouchableOpacity
                style={styles.sidebarFooterItem}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
                <Text style={[styles.sidebarFooterText, styles.dropdownDanger]}>
                  Log Out
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sidebarFooterItem}
                onPress={() => setSidebarOpen(false)}
              >
                <Ionicons
                  name="close-outline"
                  size={20}
                  color={isDark ? "#aaa" : "#666"}
                />
                <Text style={styles.sidebarFooterText}>Close Menu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* Page Content */}
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
    </View>
  );
}
