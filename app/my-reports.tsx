import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AGENCY_COLORS } from "../constants/agencies";
import { useAuth } from "../contexts/AuthContext";
import { deleteIncidentReport, getUserIncidents } from "../services/firestoreService";
import { showAlert } from "../utils/crossPlatformAlert";

type MyIncident = {
  id: string;
  situation?: string;
  description?: string;
  injuryLevel?: string;
  location?: string;
  status?: string;
  involvedAgency?: string;
  createdAt?: { toDate: () => Date };
};

function formatReportDate(createdAt?: { toDate: () => Date }) {
  if (!createdAt?.toDate) return "Unknown date";
  return createdAt.toDate().toLocaleString();
}

function getReportStatusColor(status?: string) {
  if (status === "resolved") return "#34C759";
  if (status === "in_progress") return "#FF9500";
  return "#FF3B30";
}

export default function MyReportsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const { user } = useAuth();
  const [reports, setReports] = useState<MyIncident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    getUserIncidents(user.uid).then((result) => {
      if (result.success && result.data) {
        setReports(result.data as MyIncident[]);
      }
      setLoading(false);
    });
  }, [user]);

  const removeReport = (id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
    deleteIncidentReport(id);
  };

  const handleLongPress = (item: MyIncident) => {
    showAlert(
      "Delete Report",
      "Are you sure you want to delete this incident report? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => removeReport(item.id),
        },
      ],
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#000" : "#f5f5f5",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      paddingTop: 30,
      backgroundColor: isDark ? "#1a1a1a" : "#fff",
      gap: 8,
    },
    backButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: isDark ? "#fff" : "#000",
    },
    listContent: {
      padding: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyContainer: {
      alignItems: "center",
      paddingTop: 60,
    },
    emptyText: {
      fontSize: 16,
      color: isDark ? "#888" : "#666",
      marginTop: 12,
    },
    card: {
      backgroundColor: isDark ? "#1a1a1a" : "#fff",
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 6,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
      flex: 1,
      marginRight: 8,
    },
    badges: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    agencyTag: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    agencyTagText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "700",
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    statusText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    meta: {
      fontSize: 12,
      color: isDark ? "#888" : "#666",
      marginTop: 2,
    },
  });

  const renderItem = ({ item }: { item: MyIncident }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onLongPress={() => handleLongPress(item)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>
          {item.situation || item.description || "Incident Report"}
        </Text>
        <View style={styles.badges}>
          {item.involvedAgency && (
            <View
              style={[
                styles.agencyTag,
                { backgroundColor: AGENCY_COLORS[item.involvedAgency as keyof typeof AGENCY_COLORS] || "#999" },
              ]}
            >
              <Text style={styles.agencyTagText}>{item.involvedAgency}</Text>
            </View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: getReportStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{(item.status || "pending").replace("_", " ")}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.meta}>Injury: {item.injuryLevel || "Not specified"}</Text>
      <Text style={styles.meta}>Location: {item.location || "Not provided"}</Text>
      <Text style={styles.meta}>Submitted: {formatReportDate(item.createdAt)}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? "#fff" : "#333"} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Incident History Report</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color={isDark ? "#555" : "#ccc"} />
              <Text style={styles.emptyText}>You haven&apos;t submitted any reports yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
