import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TermsPrivacyScreen() {
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
      marginBottom: 16, boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.08)',
    },
    cardTitle: { fontSize: 18, fontWeight: '700', color: isDark ? '#fff' : '#000', marginBottom: 8 },
    text: { fontSize: 14, color: isDark ? '#ccc' : '#555', lineHeight: 22, marginBottom: 8 },
    updatedText: {
      fontSize: 12, color: isDark ? '#666' : '#999', fontStyle: 'italic', marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 16, fontWeight: '700', color: isDark ? '#fff' : '#000',
      marginTop: 16, marginBottom: 8,
    },
    listItem: {
      flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8,
    },
    listNumber: {
      width: 20, fontSize: 14, color: isDark ? '#ccc' : '#555', fontWeight: '600',
    },
    listText: {
      flex: 1, fontSize: 14, color: isDark ? '#ccc' : '#555', lineHeight: 22,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Privacy</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Terms of Service</Text>
          <Text style={styles.updatedText}>Last updated: June 27, 2026</Text>

          <Text style={styles.text}>
            By using the Incident app, you agree to the following terms and conditions.
            Please read them carefully before using our services.
          </Text>

          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.text}>
            By accessing or using Incident, you agree to be bound by these Terms of Service.
            If you do not agree, please do not use the app.
          </Text>

          <Text style={styles.sectionTitle}>2. User Responsibilities</Text>
          <View style={styles.listItem}>
            <Text style={styles.listNumber}>•</Text>
            <Text style={styles.listText}>Provide accurate and truthful information when reporting incidents</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listNumber}>•</Text>
            <Text style={styles.listText}>Do not submit false or misleading reports</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listNumber}>•</Text>
            <Text style={styles.listText}>Keep your account credentials secure and confidential</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listNumber}>•</Text>
            <Text style={styles.listText}>Use the app only for lawful purposes</Text>
          </View>

          <Text style={styles.sectionTitle}>3. Incident Reports</Text>
          <Text style={styles.text}>
            Incident reports submitted through the app are forwarded to the appropriate government
            agencies for action. We do not guarantee response times but strive to ensure your
            report reaches the right authorities.
          </Text>

          <Text style={styles.sectionTitle}>4. Limitation of Liability</Text>
          <Text style={styles.text}>
            Incident is a reporting platform and is not a replacement for emergency services.
            In life-threatening situations, please call your local emergency hotline immediately.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Privacy Policy</Text>
          <Text style={styles.updatedText}>Last updated: June 27, 2026</Text>

          <Text style={styles.text}>
            Your privacy is important to us. This policy outlines how we collect, use, and protect
            your personal information.
          </Text>

          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <View style={styles.listItem}>
            <Text style={styles.listNumber}>•</Text>
            <Text style={styles.listText}>Account information (name, email address, profile photo)</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listNumber}>•</Text>
            <Text style={styles.listText}>Location data when you report an incident</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listNumber}>•</Text>
            <Text style={styles.listText}>Photos and descriptions you submit with reports</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listNumber}>•</Text>
            <Text style={styles.listText}>Device information for app functionality and analytics</Text>
          </View>

          <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
          <View style={styles.listItem}>
            <Text style={styles.listNumber}>•</Text>
            <Text style={styles.listText}>To process and forward incident reports to agencies</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listNumber}>•</Text>
            <Text style={styles.listText}>To communicate updates about your reports</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listNumber}>•</Text>
            <Text style={styles.listText}>To improve app features and user experience</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listNumber}>•</Text>
            <Text style={styles.listText}>To comply with legal obligations</Text>
          </View>

          <Text style={styles.sectionTitle}>3. Data Sharing</Text>
          <Text style={styles.text}>
            We do not sell your personal information. Incident reports are shared with authorized
            response agencies for the purpose of addressing your concerns. Anonymized data may be
            used for analytics and reporting.
          </Text>

          <Text style={styles.sectionTitle}>4. Data Security</Text>
          <Text style={styles.text}>
            We implement industry-standard security measures including encryption in transit and at rest.
            However, no method of electronic storage is 100% secure, and we cannot guarantee absolute security.
          </Text>

          <Text style={styles.sectionTitle}>5. Your Rights</Text>
          <View style={styles.listItem}>
            <Text style={styles.listNumber}>•</Text>
            <Text style={styles.listText}>Access and review your personal data</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listNumber}>•</Text>
            <Text style={styles.listText}>Request correction or deletion of your data</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listNumber}>•</Text>
            <Text style={styles.listText}>Withdraw consent for data processing</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listNumber}>•</Text>
            <Text style={styles.listText}>Delete your account at any time</Text>
          </View>

          <Text style={styles.sectionTitle}>6. Contact</Text>
          <Text style={styles.text}>
            For questions about these terms or privacy practices, contact us at:
          </Text>
          <Text style={[styles.text, { color: '#007AFF', fontWeight: '600', marginTop: 4 }]}>
            support@incidentapp.com
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}