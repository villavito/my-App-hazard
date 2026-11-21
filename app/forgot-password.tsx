import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HAS_BACKEND, postToBackend } from '../config/api';
import { sendResetEmail } from '../services/authService';
import { showAlert } from '../utils/crossPlatformAlert';
import {
  formatMobile,
  isValidMobile,
  mobileDigits,
  mobileErrorMessage,
  toE164Mobile,
} from '../utils/phoneNumber';

type RecoveryMethod = 'email' | 'phone';

export default function ForgotPasswordScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [method, setMethod] = useState<RecoveryMethod>('email');
  const [email, setEmail] = useState('');
  // The 10 digits after +63, as on the signup screen.
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#000' : '#fff',
    },
    header: {
      padding: 20,
      paddingTop: 40,
      alignItems: 'center',
    },
    logo: {
      fontSize: 48,
      fontWeight: 'bold',
      color: '#007AFF',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: isDark ? '#888' : '#666',
      marginBottom: 40,
      textAlign: 'center',
      paddingHorizontal: 20,
    },
    form: {
      paddingHorizontal: 20,
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
      backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa',
      padding: 16,
      borderRadius: 12,
      fontSize: 16,
      color: isDark ? '#fff' : '#000',
      borderWidth: 1,
      borderColor: isDark ? '#444' : '#e0e0e0',
    },
    methodSwitch: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#2a2a2a' : '#f0f1f3',
      borderRadius: 12,
      padding: 4,
      marginBottom: 20,
    },
    methodOption: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 9,
      alignItems: 'center',
    },
    methodOptionActive: {
      backgroundColor: '#007AFF',
    },
    methodOptionText: {
      fontSize: 15,
      fontWeight: '600',
      color: isDark ? '#aaa' : '#555',
    },
    methodOptionTextActive: {
      color: '#fff',
    },
    phoneRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#444' : '#e0e0e0',
    },
    phonePrefix: {
      paddingLeft: 16,
      paddingRight: 12,
      paddingVertical: 16,
      borderRightWidth: 1,
      borderRightColor: isDark ? '#444' : '#e0e0e0',
    },
    phonePrefixText: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
    },
    phoneInput: {
      flex: 1,
      padding: 16,
      fontSize: 16,
      color: isDark ? '#fff' : '#000',
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
    backContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 20,
    },
    backText: {
      color: isDark ? '#888' : '#666',
      fontSize: 14,
    },
    backLink: {
      color: '#007AFF',
      fontSize: 14,
      fontWeight: '600',
    },
    infoBox: {
      backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa',
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
      borderLeftWidth: 4,
      borderLeftColor: '#007AFF',
    },
    infoText: {
      fontSize: 14,
      color: isDark ? '#ccc' : '#666',
      lineHeight: 20,
    },
  });

  // The backend keys reset codes by the exact email / number string, so
  // " Juan@Gmail.com" and "juan@gmail.com" must be sent identically in every step.
  const normalizedEmail = email.trim().toLowerCase();
  const recoveryTarget =
    method === 'email' ? { email: normalizedEmail } : { phone: toE164Mobile(mobile) };
  const sentTo = method === 'email' ? normalizedEmail : `+63 ${formatMobile(mobile)}`;

  const handleSendCode = async () => {
    if (method === 'email') {
      if (!normalizedEmail) {
        showAlert('Error', 'Please enter your email address');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        showAlert('Error', 'Please enter a valid email address');
        return;
      }
    } else if (!isValidMobile(mobile)) {
      showAlert('Error', mobileErrorMessage(mobile));
      return;
    }

    setLoading(true);
    try {
      // Email resets go through Firebase's own reset email (a link to a page
      // where the user picks a new password), so they work with no backend.
      if (method === 'email') {
        const result = await sendResetEmail(normalizedEmail);
        if (!result.success) {
          showAlert('Error', result.error);
          return;
        }
        showAlert(
          'Check Your Email',
          'If an account exists for this email, we sent a link to reset your password. Open it, choose a new password, then sign in. Check your spam folder too.',
          [{ text: 'OK', onPress: () => router.push('/login') }],
        );
        return;
      }

      const { ok, data } = await postToBackend(
        '/auth/forgot-password/send-code',
        recoveryTarget,
      );

      if (!ok || !data.success) {
        showAlert('Error', data.error || 'Failed to send reset code');
        return;
      }

      // The server doesn't say whether the account exists (so this screen
      // can't be used to find out who has one), hence "if".
      showAlert(
        'Check Your Messages',
        'If an account uses this mobile number, a 6-digit reset code has been sent by SMS. It expires in 10 minutes.',
      );
      setStep('reset');
    } catch {
      showAlert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code || code.length !== 6) {
      showAlert(
        'Error',
        method === 'email'
          ? 'Please enter the 6-digit code sent to your email'
          : 'Please enter the 6-digit code sent to your mobile number',
      );
      return;
    }
    // Same rules as the Create Account screen.
    if (
      newPassword.length < 8 ||
      !/[A-Z]/.test(newPassword) ||
      !/[a-z]/.test(newPassword) ||
      !/\d/.test(newPassword)
    ) {
      showAlert(
        'Weak Password',
        'Your new password needs at least 8 characters, an uppercase letter, a lowercase letter, and a number.',
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const verify = await postToBackend('/auth/forgot-password/verify-code', {
        ...recoveryTarget,
        code,
      });
      if (!verify.ok || !verify.data.success) {
        showAlert('Error', verify.data.error || 'Invalid or expired code');
        return;
      }

      const reset = await postToBackend('/auth/forgot-password/reset', {
        ...recoveryTarget,
        code,
        newPassword,
      });
      const resetData = reset.data;
      if (!reset.ok || !resetData.success) {
        showAlert('Error', resetData.error || 'Failed to reset password');
        return;
      }

      showAlert(
        'Password Reset',
        'Your password has been reset successfully. Please sign in with your new password.',
        [{ text: 'OK', onPress: () => router.push('/login') }]
      );
    } catch {
      showAlert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMethod = (next: RecoveryMethod) => {
    setMethod(next);
    setCode('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Incident</Text>
        <Text style={styles.subtitle}>Reset your password</Text>
      </View>

      <View style={styles.form}>
        {step === 'request' ? (
          <>
            {/* SMS codes need the backend server, which the live web app
                doesn't have - there, only the email option is offered. */}
            {HAS_BACKEND && (
            <View style={styles.methodSwitch}>
              {(
                [
                  ['email', 'Email'],
                  ['phone', 'Mobile Number'],
                ] as const
              ).map(([value, label]) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.methodOption, method === value && styles.methodOptionActive]}
                  onPress={() => switchMethod(value)}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.methodOptionText,
                      method === value && styles.methodOptionTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            )}

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                {method === 'email'
                  ? 'Enter your email address and we’ll send you a link to reset your password.'
                  : 'Enter the mobile number saved on your account and we’ll text you a 6-digit code to reset your password.'}
              </Text>
            </View>

            {method === 'email' ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={isDark ? '#888' : '#999'}
                  value={email}
                  // Emails never contain whitespace; stripping it also stops
                  // pasted multi-line text from stretching the field on Android.
                  onChangeText={(text) => setEmail(text.replace(/\s/g, ''))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  multiline={false}
                  numberOfLines={1}
                />
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mobile Number</Text>
                <View style={styles.phoneRow}>
                  <View style={styles.phonePrefix}>
                    <Text style={styles.phonePrefixText}>🇵🇭 +63</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="917 123 4567"
                    placeholderTextColor={isDark ? '#888' : '#999'}
                    value={formatMobile(mobile)}
                    onChangeText={(text) => setMobile(mobileDigits(text))}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    maxLength={14}
                    multiline={false}
                    numberOfLines={1}
                  />
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={handleSendCode}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading
                  ? 'Sending...'
                  : method === 'email'
                    ? 'Send Reset Link'
                    : 'Send Reset Code'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Enter the 6-digit code sent to {sentTo} and choose a new password.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Reset Code</Text>
              <TextInput
                style={styles.input}
                placeholder="123456"
                placeholderTextColor={isDark ? '#888' : '#999'}
                value={code}
                onChangeText={(text) => setCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="number-pad"
                autoComplete="sms-otp"
                textContentType="oneTimeCode"
                maxLength={6}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter new password"
                placeholderTextColor={isDark ? '#888' : '#999'}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
                multiline={false}
                numberOfLines={1}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                placeholderTextColor={isDark ? '#888' : '#999'}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                multiline={false}
                numberOfLines={1}
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleResetPassword}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep('request')} disabled={loading}>
              <Text style={[styles.backLink, { textAlign: 'center', marginTop: 16 }]}>
                {method === 'email' ? 'Use a different email' : 'Use a different number'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.backContainer}>
          <Text style={styles.backText}>Remember your password? </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.backLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
