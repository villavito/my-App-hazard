import { Slot } from 'expo-router';
import LoadingScreen from '../components/LoadingScreen';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';

function LayoutContent() {
  const { loading, navigationLoading } = useAuth();

  // Show loading screen during auth initialization or navigation
  if (loading || navigationLoading) {
    return <LoadingScreen message={loading ? 'Initializing app...' : 'Loading...'} />;
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
