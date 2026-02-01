import { Slot } from 'expo-router';
import LoadingScreen from '../components/LoadingScreen';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';

function LayoutContent() {
  const { loading } = useAuth();

  // Show loading screen during auth initialization
  if (loading) {
    return <LoadingScreen />;
  }

  return <Slot />;
}

export default function Layout() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <LayoutContent />
      </NotificationProvider>
    </AuthProvider>
  );
}
