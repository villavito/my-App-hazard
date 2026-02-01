import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, useColorScheme, View } from 'react-native';

interface LoadingScreenProps {
  message?: string;
  type?: 'login' | 'general' | 'upload' | 'location';
}

export default function LoadingScreen({ message = 'Loading...', type = 'general' }: LoadingScreenProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const getLoadingMessage = () => {
    switch (type) {
      case 'login':
        return 'Signing in...';
      case 'upload':
        return 'Uploading photo...';
      case 'location':
        return 'Getting location...';
      default:
        return message;
    }
  };

  const getLoadingIcon = () => {
    switch (type) {
      case 'login':
        return 'lock-open-outline';
      case 'upload':
        return 'cloud-upload-outline';
      case 'location':
        return 'location-outline';
      default:
        return 'refresh-outline';
    }
  };

  const getLoadingColor = () => {
    switch (type) {
      case 'login':
        return '#34C759'; // Green for success
      case 'upload':
        return '#007AFF'; // Blue for upload
      case 'location':
        return '#FF9500'; // Orange for location
      default:
        return '#007AFF'; // Default blue
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#000' : '#fff',
    },
    loadingContent: {
      alignItems: 'center',
      padding: 40,
      borderRadius: 20,
      backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa',
    },
    iconContainer: {
      marginBottom: 20,
    },
    loadingIcon: {
      fontSize: 48,
      color: getLoadingColor(),
    },
    loadingText: {
      marginTop: 16,
      fontSize: 18,
      color: isDark ? '#fff' : '#000',
      fontWeight: '600',
      textAlign: 'center',
    },
    subText: {
      marginTop: 8,
      fontSize: 14,
      color: isDark ? '#888' : '#666',
      textAlign: 'center',
    },
    activityIndicator: {
      marginBottom: 20,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.loadingContent}>
        <ActivityIndicator size="large" color={getLoadingColor()} style={styles.activityIndicator} />
        <View style={styles.iconContainer}>
          <Ionicons name={getLoadingIcon()} style={styles.loadingIcon} />
        </View>
        <Text style={styles.loadingText}>{getLoadingMessage()}</Text>
        <Text style={styles.subText}>Please wait...</Text>
      </View>
    </View>
  );
}
