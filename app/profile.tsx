import { useRouter } from 'expo-router';
import { deleteField, doc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { showAlert } from '../utils/crossPlatformAlert';
import {
  formatMobile,
  isValidMobile,
  mobileDigits,
  mobileErrorMessage,
  toE164Mobile,
} from '../utils/phoneNumber';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { user, userRole, refreshUserRole } = useAuth();
  const [displayName, setDisplayName] = useState(userRole?.displayName || '');
  // Just the 10 digits after +63; empty for accounts made before signup
  // asked for a number.
  const [mobile, setMobile] = useState(mobileDigits(userRole?.phoneNumber || ''));
  const [mobileTouched, setMobileTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setDisplayName(userRole?.displayName || '');
    setMobile(mobileDigits(userRole?.phoneNumber || ''));
  }, [userRole]);

  // The number is optional here (older accounts may not have one yet), but
  // if anything is typed it must be a complete, valid mobile number.
  const mobileValid = isValidMobile(mobile);
  const mobileOk = mobile.length === 0 || mobileValid;
  const showMobileError = mobileTouched && mobile.length > 0 && !mobileValid;
  const canSave = displayName.trim().length > 0 && mobileOk && !isLoading;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#000' : '#fff',
    },
    header: {
      padding: 20,
      paddingTop: 40,
      backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    profileSection: {
      backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa',
      padding: 20,
      borderRadius: 12,
      marginBottom: 24,
    },
    profileHeader: {
      alignItems: 'center',
      marginBottom: 24,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: isDark ? '#4a4a4a' : '#dee2e6',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    avatarText: {
      fontSize: 32,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
    },
    email: {
      fontSize: 16,
      color: isDark ? '#888' : '#666',
      marginBottom: 4,
    },
    role: {
      fontSize: 14,
      color: isDark ? '#aaa' : '#888',
      textTransform: 'capitalize',
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      marginBottom: 8,
    },
    input: {
      backgroundColor: isDark ? '#3a3a3a' : '#fff',
      borderWidth: 1,
      borderColor: isDark ? '#4a4a4a' : '#dee2e6',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: isDark ? '#fff' : '#000',
    },
    saveButton: {
      backgroundColor: '#007AFF',
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 24,
    },
    saveButtonDisabled: {
      backgroundColor: isDark ? '#3a3a3a' : '#e9ecef',
    },
    saveButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    infoCard: {
      backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa',
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    infoLabel: {
      fontSize: 14,
      color: isDark ? '#888' : '#666',
    },
    infoValue: {
      fontSize: 14,
      color: isDark ? '#fff' : '#000',
      fontWeight: '500',
    },
    phoneInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#3a3a3a' : '#fff',
      borderWidth: 1,
      borderColor: isDark ? '#4a4a4a' : '#dee2e6',
      borderRadius: 8,
    },
    phonePrefix: {
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRightWidth: 1,
      borderRightColor: isDark ? '#4a4a4a' : '#dee2e6',
    },
    phonePrefixText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
    },
    phoneInput: {
      flex: 1,
      padding: 12,
      fontSize: 16,
      color: isDark ? '#fff' : '#000',
    },
    inputInvalid: {
      borderColor: '#FF3B30',
    },
    helperText: {
      fontSize: 13,
      marginTop: 6,
      color: isDark ? '#aaa' : '#666',
    },
    errorText: {
      fontSize: 13,
      marginTop: 6,
      color: '#FF3B30',
    },
  });

  const handleSaveProfile = async () => {
    if (!user || !displayName.trim()) {
      showAlert('Error', 'Please enter a valid name');
      return;
    }

    if (!mobileOk) {
      setMobileTouched(true);
      showAlert('Invalid Mobile Number', mobileErrorMessage(mobile));
      return;
    }

    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: displayName.trim(),
        // Clearing the field removes the saved number.
        phoneNumber: mobileValid ? toE164Mobile(mobile) : deleteField(),
      });
      // Pull the saved values back into the app so other screens show them.
      await refreshUserRole();

      showAlert('Success', 'Profile updated successfully!');
      router.back();
    } catch (error) {
      console.error('Error updating profile:', error);
      showAlert('Error', 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(displayName || user?.email || 'U')}
              </Text>
            </View>
            <Text style={styles.email}>{user?.email}</Text>
            <Text style={styles.role}>{userRole?.role?.replace('_', ' ') || 'user'}</Text>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Enter your name"
            placeholderTextColor={isDark ? '#888' : '#999'}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mobile Number</Text>
          <View
            style={[
              styles.phoneInputRow,
              showMobileError && styles.inputInvalid,
            ]}
          >
            <View style={styles.phonePrefix}>
              <Text style={styles.phonePrefixText}>🇵🇭 +63</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              value={formatMobile(mobile)}
              onChangeText={(text) => setMobile(mobileDigits(text))}
              onBlur={() => setMobileTouched(true)}
              placeholder="917 123 4567"
              placeholderTextColor={isDark ? '#888' : '#999'}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              maxLength={14}
            />
          </View>
          {showMobileError ? (
            <Text style={styles.errorText}>{mobileErrorMessage(mobile)}</Text>
          ) : (
            <Text style={styles.helperText}>
              {userRole?.phoneNumber
                ? 'Responders may call this number about your reports.'
                : 'Add your number so responders can call you about your reports.'}
            </Text>
          )}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>User ID</Text>
            <Text style={styles.infoValue}>{user?.uid?.slice(0, 8)}...</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mobile</Text>
            <Text style={styles.infoValue}>
              {userRole?.phoneNumber
                ? `+63 ${formatMobile(mobileDigits(userRole.phoneNumber))}`
                : 'Not set'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>{userRole?.role?.replace('_', ' ') || 'user'}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.saveButton,
            !canSave && styles.saveButtonDisabled
          ]}
          onPress={handleSaveProfile}
          disabled={!canSave}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Saving...' : 'Save Profile'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

