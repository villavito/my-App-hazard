import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createUserWithRole } from '../services/authService';

export default function SignupScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin' | 'super_admin'>('user');
  const [showRoleOptions, setShowRoleOptions] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#000' : '#fff',
    },
    content: {
      flexGrow: 1,
      justifyContent: 'space-between',
      paddingVertical: 24,
    },
    header: {
      paddingHorizontal: 24,
      marginBottom: 24,
    },
    title: {
      fontSize: 34,
      fontWeight: '800',
      color: isDark ? '#fff' : '#111',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      lineHeight: 24,
      color: isDark ? '#aaa' : '#555',
    },
    form: {
      paddingHorizontal: 24,
    },
    inputGroup: {
      marginBottom: 18,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#fff' : '#111',
      marginBottom: 8,
    },
    input: {
      backgroundColor: isDark ? '#1f1f1f' : '#f4f5f7',
      padding: 16,
      borderRadius: 14,
      fontSize: 16,
      color: isDark ? '#fff' : '#111',
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#e0e0e0',
    },
    passwordContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1f1f1f' : '#f4f5f7',
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#e0e0e0',
      borderRadius: 14,
    },
    passwordInput: {
      flex: 1,
      padding: 16,
      fontSize: 16,
      color: isDark ? '#fff' : '#111',
    },
    eyeIcon: {
      paddingHorizontal: 16,
      color: isDark ? '#888' : '#666',
    },
    button: {
      backgroundColor: '#007AFF',
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center',
      marginTop: 8,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
    footer: {
      paddingHorizontal: 24,
      paddingTop: 18,
      alignItems: 'center',
    },
    footerText: {
      color: isDark ? '#aaa' : '#666',
      fontSize: 14,
    },
    footerLink: {
      color: '#007AFF',
      fontSize: 14,
      fontWeight: '700',
    },
    dropdown: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: isDark ? '#1f1f1f' : '#f4f5f7',
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#e0e0e0',
    },
    dropdownText: {
      color: isDark ? '#fff' : '#111',
      fontSize: 16,
    },
    dropdownIcon: {
      color: isDark ? '#888' : '#666',
    },
    dropdownOptions: {
      marginTop: 8,
      borderRadius: 14,
      backgroundColor: isDark ? '#1f1f1f' : '#f4f5f7',
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#e0e0e0',
      overflow: 'hidden',
    },
    dropdownOption: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : '#e0e0e0',
    },
    dropdownOptionText: {
      color: isDark ? '#fff' : '#111',
      fontSize: 16,
    },
  });

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const result = await createUserWithRole(email.trim(), password, name.trim(), role);
      if (result.success && result.user) {
        const selectedRole = result.user.role;
        const route = selectedRole === 'super_admin'
          ? '/admin/super-admin'
          : selectedRole === 'admin'
            ? '/admin/dashboard'
            : '/dashboard';

        Alert.alert('Success', 'Account created successfully!', [
          { text: 'OK', onPress: () => router.replace(route) },
        ]);
      } else {
        Alert.alert('Signup Error', result.error || 'Unable to create account');
      }
    } catch (error: any) {
      Alert.alert('Signup Error', error?.message || 'Unable to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Create an account</Text>
            <Text style={styles.subtitle}>Sign up to access incident reporting, dashboard views, and secure account features.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Role</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowRoleOptions((prev) => !prev)}
              >
                <Text style={styles.dropdownText}>{role.replace('_', ' ')}</Text>
                <Ionicons name={showRoleOptions ? 'chevron-up' : 'chevron-down'} size={20} style={styles.dropdownIcon} />
              </TouchableOpacity>
              {showRoleOptions ? (
                <View style={styles.dropdownOptions}>
                  {['user', 'admin', 'super_admin'].map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={styles.dropdownOption}
                      onPress={() => {
                        setRole(option as 'user' | 'admin' | 'super_admin');
                        setShowRoleOptions(false);
                      }}
                    >
                      <Text style={styles.dropdownOptionText}>{option.replace('_', ' ')}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor={isDark ? '#888' : '#999'}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={isDark ? '#888' : '#999'}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Create a password"
                  placeholderTextColor={isDark ? '#888' : '#999'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} style={styles.eyeIcon} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm your password"
                  placeholderTextColor={isDark ? '#888' : '#999'}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword((prev) => !prev)}>
                  <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={24} style={styles.eyeIcon} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{' '}
              <Text style={styles.footerLink} onPress={() => router.push('/login')}>
                Sign In
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

