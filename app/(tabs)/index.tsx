import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { getUserIncidents } from "../../services/firestoreService";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const { user, userRole } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    const result = await getUserIncidents(user.uid);
    if (result.success && result.data) {
      const incidents = result.data as any[];
      setStats({
        total: incidents.length,
        pending: incidents.filter((i: any) => i.status === "pending").length,
        inProgress: incidents.filter(
          (i: any) => i.status === "in_progress" || i.status === "in-progress",
        ).length,
        resolved: incidents.filter((i: any) => i.status === "resolved").length,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#000" : "#f5f5f5",
    },
    scrollContent: {
      paddingBottom: 20,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
      backgroundColor: isDark ? "#1a1a1a" : "#fff",
    },
    headerTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    greeting: {
      fontSize: 14,
      color: isDark ? "#888" : "#666",
    },
    userName: {
      fontSize: 24,
      fontWeight: "700",
      color: isDark ? "#fff" : "#000",
      marginTop: 2,
    },
    avatarContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "#007AFF",
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "700",
    },
    statsRow: {
      flexDirection: "row",
      paddingHorizontal: 20,
      marginTop: 20,
      gap: 10,
    },
    statCard: {
      flex: 1,
      backgroundColor: isDark ? "#1a1a1a" : "#fff",
      padding: 14,
      borderRadius: 14,
      alignItems: "center",
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    statNumber: {
      fontSize: 22,
      fontWeight: "800",
      color: "#007AFF",
    },
    statLabel: {
      fontSize: 11,
      color: isDark ? "#888" : "#666",
      marginTop: 4,
      textAlign: "center",
    },
    section: {
      paddingHorizontal: 20,
      marginTop: 24,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: isDark ? "#fff" : "#000",
    },
    actionGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    actionCard: {
      width: "48%",
      backgroundColor: isDark ? "#1a1a1a" : "#fff",
      padding: 20,
      borderRadius: 16,
      alignItems: "center",
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    actionIcon: {
      marginBottom: 10,
    },
    actionLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
      textAlign: "center",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>WELCOME</Text>
              <Text style={styles.userName}>
                {userRole?.displayName || "User"}
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/profile")}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {getInitials(userRole?.displayName || user?.email || "U")}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* DASHBOARD */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>DASHBOARD</Text>
          </View>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push("/capture-incident")}
            >
              <Ionicons
                name="camera-outline"
                size={32}
                color="#007AFF"
                style={styles.actionIcon}
              />
              <Text style={styles.actionLabel}>Report Incident</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push("/my-reports")}
            >
              <Ionicons
                name="document-text-outline"
                size={32}
                color="#007AFF"
                style={styles.actionIcon}
              />
              <Text style={styles.actionLabel}>My Incident History Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
