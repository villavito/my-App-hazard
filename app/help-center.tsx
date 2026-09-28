import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FAQS = [
  {
    q: 'How do I report an incident?',
    a: 'Tap the "Report Incident" button on the Home tab. Fill in the details, add photos if needed, and submit. Your report will be sent to the appropriate agency.',
  },
  {
    q: 'What agencies will receive my report?',
    a: 'Depending on the type of incident, reports are sent to PNP (Police), BFP (Fire), RHU (Medical), or BDRRMC (Disaster Risk Reduction).',
  },
  {
    q: 'Can I track my incident report?',
    a: 'Yes! Go to your Home tab to see the status of all your reports. Statuses include Pending, In Progress, and Resolved.',
  },
  {
    q: 'How do I reset my password?',
    a: 'Go to Settings > Change Password. Enter your email and we will send you a reset link.',
  },
  {
    q: 'Is my data secure?',
    a: 'Absolutely. All data is encrypted and stored securely with Firebase. We never share your personal information without your consent.',
  },
  {
    q: 'How do I update my profile?',
    a: 'Go to Settings > Edit Profile or tap your avatar on the Home screen to update your display name.',
  },
  {
    q: 'Who can see my incident reports?',
    a: 'Your reports are visible to you and the assigned response agency. Your identity is kept confidential from the public.',
  },
];

export default function HelpCenterScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

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
    searchContainer: { marginBottom: 16 },
    searchInput: {
      backgroundColor: isDark ? '#1f1f1f' : '#fff', paddingHorizontal: 16, paddingVertical: 12,
      borderRadius: 12, fontSize: 15, color: isDark ? '#fff' : '#000',
      borderWidth: 1, borderColor: isDark ? '#333' : '#e0e0e0',
    },
    faqCard: {
      backgroundColor: isDark ? '#1a1a1a' : '#fff', borderRadius: 14, marginBottom: 10,
      overflow: 'hidden', boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.08)',
    },
    faqQuestion: {
      flexDirection: 'row', alignItems: 'center', padding: 16,
    },
    faqQuestionText: {
      flex: 1, fontSize: 15, fontWeight: '600', color: isDark ? '#fff' : '#000',
    },
    faqAnswer: {
      paddingHorizontal: 16, paddingBottom: 16,
    },
    faqAnswerText: {
      fontSize: 14, color: isDark ? '#ccc' : '#555', lineHeight: 22,
    },
    contactCard: {
      backgroundColor: isDark ? '#1a1a1a' : '#fff', borderRadius: 14, padding: 20, marginTop: 8,
      boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.08)',
    },
    contactTitle: { fontSize: 18, fontWeight: '700', color: isDark ? '#fff' : '#000', marginBottom: 8 },
    contactText: { fontSize: 14, color: isDark ? '#ccc' : '#555', lineHeight: 22, marginBottom: 4 },
    contactLink: { color: '#007AFF', fontWeight: '600', marginTop: 4 },
  });

  const filteredFaqs = FAQS.filter(
    (faq) =>
      faq.q.toLowerCase().includes(search.toLowerCase()) ||
      faq.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Center</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for help..."
            placeholderTextColor={isDark ? '#888' : '#999'}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {filteredFaqs.map((faq, index) => (
          <TouchableOpacity
            key={index}
            style={styles.faqCard}
            onPress={() => setExpandedIndex(expandedIndex === index ? null : index)}
          >
            <View style={styles.faqQuestion}>
              <Text style={styles.faqQuestionText}>{faq.q}</Text>
              <Ionicons
                name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={isDark ? '#888' : '#999'}
              />
            </View>
            {expandedIndex === index && (
              <View style={styles.faqAnswer}>
                <Text style={styles.faqAnswerText}>{faq.a}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Still need help?</Text>
          <Text style={styles.contactText}>
            If you could not find the answer you are looking for, feel free to contact our support team.
          </Text>
          <Text style={styles.contactText}>
            Email: <Text style={styles.contactLink}>support@incidentapp.com</Text>
          </Text>
          <Text style={styles.contactText}>Response time: Within 24 hours</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}