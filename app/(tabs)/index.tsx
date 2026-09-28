import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
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
import { showAlert } from "../../utils/crossPlatformAlert";

// WMO weather codes (https://open-meteo.com/en/docs) collapsed into a small
// set of icon/label buckets - the API returns a granular code but the widget
// only has room for a short description.
const WEATHER_CODES: Record<
  number,
  { label: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  0: { label: "Clear sky", icon: "sunny-outline" },
  1: { label: "Mostly clear", icon: "partly-sunny-outline" },
  2: { label: "Partly cloudy", icon: "partly-sunny-outline" },
  3: { label: "Overcast", icon: "cloud-outline" },
  45: { label: "Foggy", icon: "cloud-outline" },
  48: { label: "Foggy", icon: "cloud-outline" },
  51: { label: "Light drizzle", icon: "rainy-outline" },
  53: { label: "Drizzle", icon: "rainy-outline" },
  55: { label: "Heavy drizzle", icon: "rainy-outline" },
  61: { label: "Light rain", icon: "rainy-outline" },
  63: { label: "Rain", icon: "rainy-outline" },
  65: { label: "Heavy rain", icon: "rainy-outline" },
  71: { label: "Light snow", icon: "snow-outline" },
  73: { label: "Snow", icon: "snow-outline" },
  75: { label: "Heavy snow", icon: "snow-outline" },
  80: { label: "Rain showers", icon: "rainy-outline" },
  81: { label: "Rain showers", icon: "rainy-outline" },
  82: { label: "Violent rain showers", icon: "rainy-outline" },
  95: { label: "Thunderstorm", icon: "thunderstorm-outline" },
  96: { label: "Thunderstorm", icon: "thunderstorm-outline" },
  99: { label: "Thunderstorm", icon: "thunderstorm-outline" },
};

function describeWeatherCode(code: number) {
  return (
    WEATHER_CODES[code] ?? { label: "Unknown", icon: "help-outline" as const }
  );
}

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
  const [weather, setWeather] = useState<{
    temperature: number;
    code: number;
  } | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherPermissionBlocked, setWeatherPermissionBlocked] =
    useState(false);

  const fetchWeather = async () => {
    setWeatherLoading(true);
    setWeatherError(null);
    setWeatherPermissionBlocked(false);
    try {
      const { status, canAskAgain } =
        await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        // On web, expo-location's polyfill only re-prompts when the browser
        // permission is still "prompt" (never asked) - once the browser
        // itself reports "denied", canAskAgain still comes back true here
        // but tapping to retry will just get "denied" again silently, since
        // JS can't reopen a browser permission prompt. There's also no OS
        // Settings app to deep-link to on web, unlike native.
        const blocked =
          Platform.OS === "web" ? status === "denied" : !canAskAgain;
        setWeatherError(
          blocked
            ? Platform.OS === "web"
              ? "Location blocked - tap for instructions"
              : "Location permission denied - tap to open Settings"
            : "Location permission needed for weather",
        );
        setWeatherPermissionBlocked(blocked);
        return;
      }

      if (!(await Location.hasServicesEnabledAsync())) {
        setWeatherError("Turn on location services for weather");
        return;
      }

      // Weather only needs a rough position, so a recent cached fix (instant,
      // works indoors) beats waiting on a fresh GPS lock, which indoors or on
      // a cold start regularly took longer than the old 10s timeout.
      let position = await Location.getLastKnownPositionAsync({
        maxAge: 30 * 60 * 1000,
        requiredAccuracy: 5000,
      });

      if (!position) {
        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        try {
          position = await Promise.race([
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Lowest,
            }),
            new Promise<never>((_, reject) => {
              timeoutId = setTimeout(
                () => reject(new Error("Timed out waiting for a GPS fix")),
                20000,
              );
            }),
          ]);
        } finally {
          clearTimeout(timeoutId);
        }
      }

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&current_weather=true`;

      // Android's OkHttp sometimes reuses a keep-alive connection the server
      // already closed and fails with "unexpected end of stream"; a retry
      // opens a fresh connection and almost always succeeds.
      let json: any;
      for (let attempt = 1; ; attempt++) {
        try {
          const response = await fetch(url);
          if (!response.ok)
            throw new Error(`Weather request failed (${response.status})`);
          json = await response.json();
          break;
        } catch (fetchError) {
          if (attempt >= 3) throw fetchError;
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }

      setWeather({
        temperature: Math.round(json.current_weather.temperature),
        code: json.current_weather.weathercode,
      });
    } catch (error) {
      console.warn("Error fetching weather:", error);
      setWeatherError("Couldn't load weather");
    } finally {
      setWeatherLoading(false);
    }
  };

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

  useEffect(() => {
    fetchWeather();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchData(), fetchWeather()]);
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
      boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.1)",
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
    widgetRow: {
      flexDirection: "row",
      paddingHorizontal: 20,
      marginTop: 20,
      gap: 10,
    },
    widgetCard: {
      flex: 1,
      backgroundColor: isDark ? "#1a1a1a" : "#fff",
      borderRadius: 14,
      padding: 14,
      boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.1)",
    },
    dateCardMonth: {
      fontSize: 12,
      fontWeight: "700",
      color: "#7a5f4a",
      letterSpacing: 1,
    },
    dateCardDay: {
      fontSize: 32,
      fontWeight: "800",
      color: isDark ? "#fff" : "#000",
      marginTop: 2,
    },
    dateCardWeekday: {
      fontSize: 13,
      color: isDark ? "#888" : "#666",
      marginTop: 2,
    },
    weatherCardTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    weatherTemp: {
      fontSize: 28,
      fontWeight: "800",
      color: isDark ? "#fff" : "#000",
    },
    weatherLabel: {
      fontSize: 13,
      color: isDark ? "#888" : "#666",
      marginTop: 6,
    },
    weatherErrorText: {
      fontSize: 12,
      color: isDark ? "#888" : "#666",
      marginTop: 6,
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
      boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.1)",
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
        </View>

        {/* Date & Weather */}
        <View style={styles.widgetRow}>
          <View style={styles.widgetCard}>
            <Text style={styles.dateCardMonth}>
              {new Date()
                .toLocaleDateString("en-US", { month: "long" })
                .toUpperCase()}
            </Text>
            <Text style={styles.dateCardDay}>{new Date().getDate()}</Text>
            <Text style={styles.dateCardWeekday}>
              {new Date().toLocaleDateString("en-US", { weekday: "long" })}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.widgetCard}
            activeOpacity={weatherLoading || weather ? 1 : 0.6}
            disabled={weatherLoading || !!weather}
            onPress={() => {
              if (!weatherPermissionBlocked) {
                fetchWeather();
                return;
              }
              if (Platform.OS === "web") {
                showAlert(
                  "Location Blocked",
                  "Your browser has blocked location for this site. Click the lock/site-info icon next to the address bar, set Location to Allow, then reload the page.",
                );
                return;
              }
              Linking.openSettings();
            }}
          >
            {weatherLoading ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : weather ? (
              <>
                <View style={styles.weatherCardTop}>
                  <Text style={styles.weatherTemp}>
                    {weather.temperature}°C
                  </Text>
                  <Ionicons
                    name={describeWeatherCode(weather.code).icon}
                    size={28}
                    color="#007AFF"
                  />
                </View>
                <Text style={styles.weatherLabel}>
                  {describeWeatherCode(weather.code).label}
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="cloud-offline-outline" size={22} color="#888" />
                <Text style={styles.weatherErrorText}>{weatherError}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { marginTop: 20 }]}>
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
