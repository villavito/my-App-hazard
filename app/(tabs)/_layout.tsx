import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { useColorScheme, View } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { hasUnreadNotifications } from "../../services/firestoreService";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { user } = useAuth();
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (!user) {
      setHasUnread(false);
      return;
    }

    const checkUnread = () => {
      hasUnreadNotifications(user.uid).then((result) => {
        if (result.success) setHasUnread(result.data);
      });
    };

    checkUnread();
    // Once a minute: each check costs a read on the free plan.
    const interval = setInterval(checkUnread, 60000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: isDark ? "#666" : "#999",
        tabBarStyle: {
          backgroundColor: isDark ? "#1a1a1a" : "#fff",
          borderTopColor: isDark ? "#2a2a2a" : "#e0e0e0",
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
          marginBottom: 40,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="home-outline"
              size={size}
              color={
                typeof color === "number"
                  ? isDark
                    ? "#666"
                    : "#999"
                  : (color ?? (isDark ? "#666" : "#999"))
              }
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons
                name="notifications-outline"
                size={size}
                color={
                  typeof color === "number"
                    ? isDark
                      ? "#666"
                      : "#999"
                    : (color ?? (isDark ? "#666" : "#999"))
                }
              />
              {hasUnread && (
                <View
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -4,
                    width: 9,
                    height: 9,
                    borderRadius: 5,
                    backgroundColor: "#FF3B30",
                    borderWidth: 1,
                    borderColor: isDark ? "#1a1a1a" : "#fff",
                  }}
                />
              )}
            </View>
          ),
        }}
      />
      {/* Not "profile": app/profile.tsx already owns /profile, so refreshing
          the browser on this tab opened that page instead, without the tabs. */}
      <Tabs.Screen
        name="account"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="person-outline"
              size={size}
              color={
                typeof color === "number"
                  ? isDark
                    ? "#666"
                    : "#999"
                  : (color ?? (isDark ? "#666" : "#999"))
              }
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="settings-outline"
              size={size}
              color={
                typeof color === "number"
                  ? isDark
                    ? "#666"
                    : "#999"
                  : (color ?? (isDark ? "#666" : "#999"))
              }
            />
          ),
        }}
      />
    </Tabs>
  );
}
