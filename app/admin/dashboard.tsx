import React from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";

export default function AdminDashboard() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { userRole } = useAuth();

  const isSuperAdmin = userRole?.role === "super_admin";

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#0a0a0f" : "#f0f2f5",
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 20,
      backgroundColor: isDark ? "#1a1a2e" : "#ffffff",
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    headerTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    welcomeText: {
      fontSize: 24,
      fontWeight: "800",
      color: isDark ? "#fff" : "#1a1a2e",
    },
    welcomeSubtext: {
      fontSize: 14,
      color: isDark ? "#888" : "#666",
      marginTop: 4,
    },
    headerBadge: {
      backgroundColor: isSuperAdmin ? "#FF3B30" : "#007AFF",
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
    },
    headerBadgeText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "700",
    },
    dateText: {
      fontSize: 13,
      color: isDark ? "#888" : "#999",
      marginTop: 12,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>
              Welcome back,{"\n"}
              {userRole?.displayName?.split(" ")[0] || "Admin"}
            </Text>
            <Text style={styles.welcomeSubtext}>
              Here&apos;s what&apos;s happening today
            </Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>
              {isSuperAdmin
                ? "SUPER ADMIN"
                : userRole?.agency
                  ? `${userRole.agency} ADMIN`
                  : "ADMIN"}
            </Text>
          </View>
        </View>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </View>
    </SafeAreaView>
  );
}
