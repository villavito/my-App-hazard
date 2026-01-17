import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="capture-hazard" />
        <Stack.Screen name="realtime-camera" />
        <Stack.Screen name="admin/dashboard" />
        <Stack.Screen name="admin/super-admin" />
      </Stack>
    </AuthProvider>
  );
}
