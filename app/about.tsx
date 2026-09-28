import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AboutScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: isDark ? "#000" : "#f5f5f5" },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
      backgroundColor: isDark ? "#1a1a1a" : "#fff",
    },
    backButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? "#2a2a2a" : "#f0f0f0",
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: isDark ? "#fff" : "#000",
    },
    content: { padding: 20 },
    logoSection: {
      alignItems: "center",
      paddingVertical: 30,
    },
    logoIcon: {
      width: 80,
      height: 80,
      borderRadius: 20,
      backgroundColor: "#007AFF",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    appName: {
      fontSize: 28,
      fontWeight: "800",
      color: isDark ? "#fff" : "#000",
    },
    appVersion: { fontSize: 16, color: isDark ? "#888" : "#666", marginTop: 4 },
    card: {
      backgroundColor: isDark ? "#1a1a1a" : "#fff",
      borderRadius: 14,
      padding: 20,
      marginBottom: 16,
      boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.08)",
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: isDark ? "#fff" : "#000",
      marginBottom: 8,
    },
    text: {
      fontSize: 14,
      color: isDark ? "#ccc" : "#555",
      lineHeight: 22,
      marginBottom: 8,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? "#2a2a2a" : "#eee",
    },
    rowLabel: { fontSize: 14, color: isDark ? "#aaa" : "#666" },
    rowValue: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
    },
    lastRow: { borderBottomWidth: 0 },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={isDark ? "#fff" : "#000"}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoSection}>
          <View style={styles.logoIcon}>
            <Ionicons name="shield" size={40} color="#fff" />
          </View>
          <Text style={styles.appName}>Incident</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Our Mission</Text>
          <Text style={styles.text}>
            Incident is a community safety platform that empowers citizens to
            report hazards and emergencies directly to the appropriate response
            agencies. Our goal is to streamline emergency communication and help
            response teams act faster and more efficiently.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Agency Partnerships</Text>
          <Text style={styles.text}>
            We work directly with local response agencies to ensure your reports
            reach the right people:
          </Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>PNP</Text>
            <Text style={styles.rowValue}>Philippine National Police</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>BFP</Text>
            <Text style={styles.rowValue}>Bureau of Fire Protection</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>RHU</Text>
            <Text style={styles.rowValue}>Rural Health Unit</Text>
          </View>
          <View style={[styles.row, styles.lastRow]}>
            <Text style={styles.rowLabel}>BDRRMC</Text>
            <Text style={styles.rowValue}>
              Barangay Disaster Risk Reduction
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>App Information</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>App Name</Text>
            <Text style={styles.rowValue}>Incident</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>1.0.0</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Build</Text>
            <Text style={styles.rowValue}>2024.06.27</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Platform</Text>
            <Text style={styles.rowValue}>React Native / Expo</Text>
          </View>
          <View style={[styles.row, styles.lastRow]}>
            <Text style={styles.rowLabel}>Database</Text>
            <Text style={styles.rowValue}>Firebase</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact</Text>
          <Text style={styles.text}>
            For inquiries, partnerships, or feedback, reach out to us:
          </Text>
          <Text
            style={[
              styles.text,
              { color: "#007AFF", fontWeight: "600", marginTop: 4 },
            ]}
          >
            hello@incidentapp.com
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
