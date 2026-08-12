import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacySecurityScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: isDark ? '#000' : '#f5f5f5' },
    header: {
      flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
      paddingTop: 16, paddingBottom: 12, backgroundColor: isDark ? '#1a1a1a' : '#fff',
    },
    backButton: {
      padding: 8, borderRadius: 8, backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0', marginRight: 12,
    },
    headerTitle: { fontSize: 20, fontWeight: '700', color: isDark ? '#fff' : '#000' },
    content: { padding: 20 },
    card: {
      backgroundColor: isDark ? '#1a1a1a' : '#fff', borderRadius: 14, padding: 20,
      marginBottom: 16, elevation: 1, shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2,
    },
    cardTitle: { fontSize: 18, fontWeight: '700', color: isDark ? '#fff' : '#000', marginBottom: 8 },
    text: { fontSize: 14, color: isDark ? '#ccc' : '#555', lineHeight: 22, marginBottom: 8 },
    bulletItem: {
      flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10,
    },
    bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#007AFF', marginTop: 8, marginRight: 10 },
    bulletText: { flex: 1, fontSize: 14, color: isDark ? '#ccc' : '#555', lineHeight: 22 },
    divider: { height: 1, backgroundColor: isDark ? '#2a2a2a' : '#eee', marginVertical: 16 },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Security</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Data Protection</Text>
          <Text style={styles.text}>
            Your privacy and data security are our top priorities. We implement industry-standard security measures to protect your personal information.
          </Text>
          <View style={styles.bulletItem}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText}>All data is encrypted in transit using SSL/TLS protocols</Text>
          </View>
          <View style={styles.bulletItem}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText}>Your personal details are stored securely with Firebase Authentication</Text>
          </View>
          <View style={styles.bulletItem}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText}>We never share your data with third parties without your consent</Text>
          </View>
          <View style={styles.bulletItem}>
            <View style={styles.bullet} />
            <Text style={styles.bulletText}>Incident reports are anonymized when shared with agencies</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Security Tips</Text>
          <View style={styles.bulletItem}>
            <View style={[styles.bullet, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.bulletText}>Use a strong, unique password with at least 8 characters</Text>
          </View>
          <View style={styles.bulletItem}>
            <View style={[styles.bullet, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.bulletText}>Never share your account credentials with others</Text>
          </View>
          <View style={styles.bulletItem}>
            <View style={[styles.bullet, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.bulletText}>Enable two-factor authentication for extra security</Text>
          </View>
          <View style={styles.bulletItem}>
            <View style={[styles.bullet, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.bulletText}>Log out from shared devices after use</Text>
          </View>
          <View style={styles.bulletItem}>
            <View style={[styles.bullet, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.bulletText}>Regularly review your account activity for suspicious behavior</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Data We Collect</Text>
          <Text style={styles.text}>
            We collect only the information necessary to provide our incident reporting services:
          </Text>
          <View style={styles.bulletItem}>
            <View style={[styles.bullet, { backgroundColor: '#FF9800' }]} />
            <Text style={styles.bulletText}>Account information (name, email address)</Text>
          </View>
          <View style={styles.bulletItem}>
            <View style={[styles.bullet, { backgroundColor: '#FF9800' }]} />
            <Text style={styles.bulletText}>Location data when reporting incidents</Text>
          </View>
          <View style={styles.bulletItem}>
            <View style={[styles.bullet, { backgroundColor: '#FF9800' }]} />
            <Text style={styles.bulletText}>Photos and descriptions of incidents you report</Text>
          </View>
          <View style={styles.bulletItem}>
            <View style={[styles.bullet, { backgroundColor: '#FF9800' }]} />
            <Text style={styles.bulletText}>Device information for app functionality</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Us</Text>
          <Text style={styles.text}>
            If you have any questions about your privacy or security, please contact our support team at:
          </Text>
          <Text style={[styles.text, { color: '#007AFF', fontWeight: '600', marginTop: 8 }]}>
            support@incidentapp.com
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}