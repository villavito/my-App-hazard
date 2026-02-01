import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';

export default function UserDashboard() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { user } = useAuth();
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [comment, setComment] = useState('');

  // Debug: Log what data we're getting
  console.log('Dashboard - User object:', user);
  console.log('Dashboard - User email:', user?.email);
  console.log('Dashboard - User displayName:', user?.displayName);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#000' : '#fff',
    },
    header: {
      padding: 20,
      paddingTop: 40,
      backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa',
      alignItems: 'center',
    },
    welcomeText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: isDark ? '#888' : '#666',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      marginBottom: 16,
    },
    card: {
      backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa',
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    cardIcon: {
      fontSize: 24,
      marginRight: 16,
      color: '#007AFF',
    },
    cardContent: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      marginBottom: 4,
    },
    cardDescription: {
      fontSize: 14,
      color: isDark ? '#888' : '#666',
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    statCard: {
      backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa',
      padding: 16,
      borderRadius: 12,
      flex: 1,
      marginHorizontal: 4,
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#007AFF',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 14,
      color: isDark ? '#888' : '#666',
      textAlign: 'center',
    },
    logoutButton: {
      backgroundColor: '#FF3B30',
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 20,
    },
    logoutButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '600',
    },
    profileCard: {
      backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa',
      padding: 20,
      borderRadius: 12,
      marginBottom: 24,
    },
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: isDark ? '#4a4a4a' : '#dee2e6',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    avatarText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      marginBottom: 4,
    },
    profileEmail: {
      fontSize: 14,
      color: isDark ? '#888' : '#666',
      marginBottom: 4,
    },
    profileRole: {
      fontSize: 14,
      color: '#007AFF',
      fontWeight: '500',
    },
    myReportsButton: {
      backgroundColor: '#007AFF',
    },
    commentButton: {
      backgroundColor: '#34C759',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: isDark ? '#2a2a2a' : '#fff',
      borderRadius: 16,
      padding: 24,
      margin: 20,
      width: '90%',
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
      marginBottom: 16,
      textAlign: 'center',
    },
    modalInput: {
      backgroundColor: isDark ? '#3a3a3a' : '#f8f9fa',
      borderWidth: 1,
      borderColor: isDark ? '#555' : '#ddd',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: isDark ? '#fff' : '#000',
      minHeight: 100,
      textAlignVertical: 'top',
      marginBottom: 16,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: isDark ? '#555' : '#e9ecef',
    },
    sendButton: {
      backgroundColor: '#007AFF',
    },
    cancelButtonText: {
      color: isDark ? '#fff' : '#000',
      fontSize: 16,
      fontWeight: '600',
    },
    sendButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  const handleLogout = async () => {
    // TODO: Implement logout logic
    router.push('/login');
  };

  const handleSendComment = () => {
    if (!comment.trim()) {
      Alert.alert('Error', 'Please enter a comment before sending.');
      return;
    }

    // Store comment in localStorage (in a real app, this would go to a database)
    try {
      const comments = JSON.parse(localStorage.getItem('admin_comments') || '[]');
      const newComment = {
        id: Date.now(),
        user: {
          name: user?.displayName || 'Anonymous User',
          email: user?.email || 'No email',
          uid: user?.uid || 'unknown'
        },
        message: comment.trim(),
        timestamp: new Date().toISOString(),
        status: 'unread'
      };
      
      comments.push(newComment);
      localStorage.setItem('admin_comments', JSON.stringify(comments));
      
      Alert.alert(
        'Success!',
        'Your comment has been sent to the admin. They will review it soon.',
        [{ text: 'OK', onPress: () => {
          setComment('');
          setShowCommentModal(false);
        }}]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send comment. Please try again.');
    }
  };

  const features: {
    icon: string;
    title: string;
    description: string;
  }[] = [
    {
      icon: 'camera-outline',
      title: 'Capture Incident',
      description: 'Report and document safety incidents',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>
            Welcome, {user?.displayName || 'User'}!
          </Text>
          <Text style={styles.subtitle}>{user?.email || 'Your dashboard'}</Text>
        </View>

        <View style={styles.content}>
          {/* User Profile Section */}
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user?.displayName || 'User').split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.displayName || 'Welcome User'}</Text>
                <Text style={styles.profileEmail}>{user?.email || 'No email available'}</Text>
                <Text style={styles.profileRole}>user</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <TouchableOpacity 
              style={[styles.card, styles.myReportsButton]} 
              onPress={() => router.push('/my-reports')}
            >
              <Ionicons name="document-text-outline" size={24} style={styles.cardIcon} />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>View My Reports</Text>
                <Text style={styles.cardDescription}>Check status of your submitted incident reports</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.card, styles.commentButton]} 
              onPress={() => setShowCommentModal(true)}
            >
              <Ionicons name="chatbubble-outline" size={24} style={styles.cardIcon} />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Comment to Admin</Text>
                <Text style={styles.cardDescription}>Send a message or feedback to the admin</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            {features.map((feature, index) => (
              <TouchableOpacity key={index} style={styles.card} onPress={() => router.push('/capture-hazard')}>
                <Ionicons name={feature.icon as keyof typeof Ionicons.glyphMap} size={24} style={styles.cardIcon} />
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{feature.title}</Text>
                  <Text style={styles.cardDescription}>{feature.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Comment Modal */}
      <Modal
        visible={showCommentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCommentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send Message to Admin</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Type your message or feedback here..."
              placeholderTextColor={isDark ? '#888' : '#999'}
              value={comment}
              onChangeText={setComment}
              multiline
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setComment('');
                  setShowCommentModal(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.sendButton]}
                onPress={handleSendComment}
              >
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

