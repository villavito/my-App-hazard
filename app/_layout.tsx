import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../contexts/AuthContext";

// A screen opened straight from its address (a browser refresh, a link) has
// nothing under it, so its back arrow did nothing. Keep the start screen
// underneath instead: going back there sends signed-in users to their own
// dashboard (see app/index.tsx).
export const unstable_settings = {
  anchor: "index",
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        {/* "auto" picks status bar icon color from the OS color scheme -
            screens vary between light and dark backgrounds by theme now that
            the app-wide dark gradient background is gone, so a single fixed
            "light" style would go invisible (white-on-white) in light mode. */}
        <StatusBar style="auto" />
        <View style={styles.overlay}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "transparent" },
              animation: "fade",
              gestureEnabled: true,
            }}
          />
        </View>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
});
