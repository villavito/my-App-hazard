import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import { useColorScheme, View } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { getUserNotifications } from "../../services/firestoreService";

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
      getUserNotifications(user.uid).then((result) => {
        if (result.success && result.data) {
          setHasUnread((result.data as any[]).some((n) => !n.read));
        }
      });
    };

    checkUnread();
    const interval = setInterval(checkUnread, 30000);
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
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
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
                color={color}
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
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
