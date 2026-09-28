import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import IncidentStatusChart, {
  type StatusSlice,
} from "../../components/IncidentStatusChart";
import IncidentTrendChart, {
  type TrendPoint,
} from "../../components/IncidentTrendChart";
import { useAuth } from "../../contexts/AuthContext";
import { getAllIncidents } from "../../services/firestoreService";
import { buildStatusData, buildTrendData } from "../../utils/incidentCharts";

const TREND_DAYS = 14;

const QUICK_ACTIONS = [
  {
    key: "incidents",
    label: "View All Incidents",
    icon: "alert-circle-outline" as const,
    route: "/admin/incidents" as const,
  },
  {
    key: "reports",
    label: "Reports",
    icon: "document-text-outline" as const,
    route: "/admin/reports" as const,
  },
  {
    key: "users",
    label: "Manage Users",
    icon: "people-outline" as const,
    route: "/admin/super-admin" as const,
    superAdminOnly: true,
  },
];

export default function AdminDashboard() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { userRole } = useAuth();
  const router = useRouter();

  const isSuperAdmin = userRole?.role === "super_admin";
  const quickActions = QUICK_ACTIONS.filter(
    (action) => !action.superAdminOnly || isSuperAdmin,
  );

  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [statusData, setStatusData] = useState<StatusSlice[]>([]);
  const [trendLoading, setTrendLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadIncidents = async () => {
      setTrendLoading(true);

      // An admin with no agency assigned matches nothing rather than
      // everything (see firestore.rules) - skip the query rather than firing
      // an unscoped one, which the rules reject outright and would otherwise
      // just silently leave the charts empty with no error surfaced.
      if (!isSuperAdmin && !userRole?.agency) {
        if (!cancelled) {
          setTrendData([]);
          setStatusData([]);
          setTrendLoading(false);
        }
        return;
      }

      const result = await getAllIncidents(
        1000,
        isSuperAdmin ? undefined : userRole?.agency,
      );
      if (!cancelled && result.success && result.data) {
        const incidents = result.data as {
          createdAt?: { toDate: () => Date };
          status?: string;
        }[];
        setTrendData(buildTrendData(incidents, TREND_DAYS));
        setStatusData(buildStatusData(incidents));
      }
      if (!cancelled) setTrendLoading(false);
    };

    loadIncidents();
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin, userRole?.agency]);

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
      boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)",
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
    section: {
      paddingHorizontal: 20,
      marginTop: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: isDark ? "#fff" : "#1a1a2e",
      marginBottom: 12,
    },
    card: {
      backgroundColor: isDark ? "#1a1a2e" : "#ffffff",
      borderRadius: 16,
      padding: 16,
      boxShadow: "0px 1px 6px rgba(0, 0, 0, 0.08)",
    },
    trendLoading: {
      height: 140,
      justifyContent: "center",
      alignItems: "center",
    },
    actionsRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 20,
    },
    actionButton: {
      flex: 1,
      alignItems: "center",
      gap: 6,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: isDark ? "#24243a" : "#f5f6f8",
    },
    actionLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: isDark ? "#fff" : "#1a1a2e",
      textAlign: "center",
    },
    subsectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: isDark ? "#888" : "#666",
      marginBottom: 10,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    divider: {
      height: 1,
      backgroundColor: isDark ? "#2a2a40" : "#eef0f3",
      marginVertical: 20,
    },
  });

  // Shared loading/loaded slot for the two dashboard charts, which both wait
  // on the same `trendLoading` flag and show the same spinner while it fetches.
  const renderChartSlot = (loading: boolean, chart: React.ReactNode) => {
    if (loading) {
      return (
        <View style={styles.trendLoading}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      );
    }
    return chart;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
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

        {/* Quick actions */}
        <View style={[styles.section, { marginBottom: 24 }]}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.card}>
            <View style={styles.actionsRow}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.key}
                  style={styles.actionButton}
                  onPress={() => router.push(action.route)}
                >
                  <Ionicons name={action.icon} size={22} color="#007AFF" />
                  <Text style={styles.actionLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.subsectionTitle}>
              Incidents{isSuperAdmin ? " (all agencies)" : ""} - last{" "}
              {TREND_DAYS} days
            </Text>
            {renderChartSlot(
              trendLoading,
              <IncidentTrendChart data={trendData} isDark={isDark} />,
            )}

            <View style={styles.divider} />

            <Text style={styles.subsectionTitle}>
              Incidents by status{isSuperAdmin ? " (all agencies)" : ""}
            </Text>
            {renderChartSlot(
              trendLoading,
              <IncidentStatusChart data={statusData} isDark={isDark} />,
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
