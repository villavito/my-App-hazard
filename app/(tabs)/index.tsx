import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#000' : '#fff',
    },
    scrollView: {
      flex: 1,
    },
    header: {
      padding: 20,
      paddingTop: 40,
      backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa',
      alignItems: 'center',
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: isDark ? '#888' : '#666',
    },
    section: {
      padding: 20,
    },
    sectionTitle: {
      fontSize: 24,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      marginBottom: 16,
    },
    featureList: {
      gap: 12,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa',
      padding: 16,
      borderRadius: 12,
    },
    featureIcon: {
      fontSize: 24,
      marginRight: 16,
    },
    featureText: {
      flex: 1,
    },
    featureTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      marginBottom: 4,
    },
    featureDescription: {
      fontSize: 14,
      color: isDark ? '#888' : '#666',
    },
    button: {
      backgroundColor: '#007AFF',
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 20,
    },
    buttonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '600',
    },
  });

  const features: Array<{
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;
  }> = [
    {
      icon: 'shield-checkmark-outline',
      title: 'Safety First',
      description: 'Advanced hazard detection and prevention systems',
    },
    {
      icon: 'analytics-outline',
      title: 'Real-time Analytics',
      description: 'Monitor and analyze potential risks instantly',
    },
    {
      icon: 'notifications-outline',
      title: 'Smart Alerts',
      description: 'Get notified about hazards before they become critical',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Hazard</Text>
          <Text style={styles.subtitle}>Your safety companion</Text>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/login')}>
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          <View style={styles.featureList}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons 
                  name={feature.icon} 
                  size={24} 
                  color="#007AFF"
                  style={styles.featureIcon}
                />
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}