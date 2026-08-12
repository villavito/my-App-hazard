import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { signOutUser } from "../../services/authService";

type SettingItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  type: "link";
  color?: string;
  route?: string;
};

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const { user, userRole } = useAuth();

  const accountSettings: SettingItem[] = [
    {
      icon: "person-outline",
      label: "Edit Profile",
      type: "link",
      route: "/profile",
    },
    {
      icon: "shield-checkmark-outline",
      label: "Privacy & Security",
      type: "link",
      route: "/privacy-security",
    },
  ];

  const supportSettings: SettingItem[] = [
    {
      icon: "help-circle-outline",
      label: "Help Center",
      type: "link",
      route: "/help-center",
    },
    {
      icon: "information-circle-outline",
      label: "About",
      type: "link",
      route: "/about",
    },
    {
      icon: "document-text-outline",
      label: "Terms & Privacy",
      type: "link",
      route: "/terms-privacy",
    },
  ];

  const handleLogout = () => {
    // Alert.alert's multi-button API doesn't work on web (react-native-web has
    // no way to map custom button onPress callbacks to a real dialog), so use
    // window.confirm there instead.
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to sign out?")) {
        signOutUser().then(() => router.replace("/login"));
      }
      return;
    }

    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOutUser();
          router.replace("/login");
        },
      },
    ]);
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
    container: { flex: 1, backgroundColor: isDark ? "#000" : "#f5f5f5" },
    header: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 12,
      backgroundColor: isDark ? "#1a1a1a" : "#fff",
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: "700",
      color: isDark ? "#fff" : "#000",
    },
    headerSubtitle: {
      fontSize: 14,
      color: isDark ? "#888" : "#666",
      marginTop: 4,
    },
    scrollContent: { paddingBottom: 30 },
    profileCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "#1a1a1a" : "#fff",
      marginHorizontal: 20,
      marginTop: 20,
      padding: 16,
      borderRadius: 14,
      elevation: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
    },
    profileAvatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: "#007AFF",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 14,
    },
    profileAvatarText: { color: "#fff", fontSize: 22, fontWeight: "700" },
    profileInfo: { flex: 1 },
    profileName: {
      fontSize: 17,
      fontWeight: "700",
      color: isDark ? "#fff" : "#000",
    },
    profileEmail: {
      fontSize: 13,
      color: isDark ? "#888" : "#666",
      marginTop: 2,
    },
    profileRole: {
      fontSize: 12,
      color: "#007AFF",
      fontWeight: "600",
      marginTop: 2,
      textTransform: "capitalize",
    },
    section: { marginTop: 24, paddingHorizontal: 20 },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: isDark ? "#888" : "#999",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 10,
      paddingLeft: 4,
    },
    settingGroup: {
      backgroundColor: isDark ? "#1a1a1a" : "#fff",
      borderRadius: 14,
      overflow: "hidden",
      elevation: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
    },
    settingItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? "#2a2a2a" : "#f0f0f0",
    },
    settingIcon: { width: 32, alignItems: "center", marginRight: 12 },
    settingLabel: { flex: 1, fontSize: 15, color: isDark ? "#fff" : "#000" },
    logoutItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      paddingHorizontal: 16,
    },
    logoutText: {
      fontSize: 15,
      fontWeight: "600",
      color: "#FF3B30",
      marginLeft: 8,
    },
    versionInfo: { alignItems: "center", paddingVertical: 20 },
    versionText: { fontSize: 12, color: isDark ? "#555" : "#ccc" },
  });

  const renderSettings = (items: SettingItem[]) => {
    return items.map((item, index) => (
      <TouchableOpacity
        key={index}
        style={styles.settingItem}
        onPress={() => {
          if (item.route) router.push(item.route as any);
        }}
      >
        <View style={styles.settingIcon}>
          <Ionicons
            name={item.icon}
            size={20}
            color={item.color || (isDark ? "#888" : "#666")}
          />
        </View>
        <Text style={styles.settingLabel}>{item.label}</Text>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={isDark ? "#555" : "#ccc"}
        />
      </TouchableOpacity>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Manage your preferences</Text>
        </View>

        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => router.push("/profile")}
        >
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {getInitials(userRole?.displayName || user?.email || "U")}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {userRole?.displayName || "User"}
            </Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <Text style={styles.profileRole}>
              {userRole?.role?.replace("_", " ") || "user"}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={isDark ? "#555" : "#ccc"}
          />
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.settingGroup}>
            {renderSettings(accountSettings)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.settingGroup}>
            {renderSettings(supportSettings)}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.settingGroup}>
            <TouchableOpacity style={styles.logoutItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
