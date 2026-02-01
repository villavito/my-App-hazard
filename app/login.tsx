import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoadingScreen from '../components/LoadingScreen';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [signInError, setSignInError] = useState('');
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
    signupContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 20,
    },
    signupText: {
      color: isDark ? '#888' : '#666',
      fontSize: 14,
    },
    signupLink: {
      color: '#007AFF',
      fontSize: 14,
      fontWeight: '600',
    },
    passwordContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa',
      borderWidth: 1,
      borderColor: isDark ? '#444' : '#e0e0e0',
      borderRadius: 12,
    },
    passwordInput: {
      flex: 1,
      padding: 16,
      fontSize: 16,
      color: isDark ? '#fff' : '#000',
    },
    eyeIcon: {
      padding: 16,
      color: isDark ? '#888' : '#666',
    },
    forgotPasswordLink: {
      alignSelf: 'flex-end',
      marginTop: 8,
    },
    forgotPasswordText: {
      color: '#007AFF',
      fontSize: 14,
      fontWeight: '600',
    },
    errorText: {
      color: '#FF3B30',
      fontSize: 14,
      marginTop: 5,
    },
    signInErrorContainer: {
      backgroundColor: '#FFE5E5',
      borderColor: '#FF3B30',
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      marginBottom: 20,
    },
    signInErrorText: {
      color: '#FF3B30',
      fontSize: 14,
      textAlign: 'center',
    },
  });

  const handleLogin = async () => {
    // Clear previous errors
    setPasswordError('');
    setEmailError('');
    setSignInError('');
    
    if (!email || !password) {
      setSignInError('Please fill in all fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    // Password validation
    if (password.length < 1) {
      setPasswordError('Password is required');
      return;
    }

    console.log('Starting login process...');
    console.log('Available functions:', { signIn: typeof signIn });
    
    if (typeof signIn !== 'function') {
      setSignInError('Authentication system not available');
      return;
    }

    // Set loading state
    setIsLoading(true);

    try {
      console.log('Attempting to sign in with:', { email });
      const result = await signIn(email, password);
      console.log('Login result:', result);
      
      if (result.success && result.user) {
        Alert.alert('Success', `Welcome back, ${result.user.displayName}!`);
        // Navigate based on user role
        if (result.user.role === 'super_admin') {
          router.push('/admin/super-admin');
        } else if (result.user.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
      } else {
        // Handle specific error types
        const errorMessage = result.error || 'Login failed';
        const lowerError = errorMessage.toLowerCase();
        
        if (lowerError.includes('auth/invalid-credential')) {
          setSignInError('Wrong password or email. Please check your login details and try again.');
        } else if (lowerError.includes('password')) {
          setPasswordError('Incorrect password. Please try again.');
        } else if (lowerError.includes('email') || lowerError.includes('user') || lowerError.includes('not found')) {
          setEmailError('Email not found. Please check your email or sign up.');
        } else if (lowerError.includes('network') || lowerError.includes('connection')) {
          setSignInError('Network error. Please check your connection and try again.');
        } else if (lowerError.includes('too many') || lowerError.includes('blocked') || lowerError.includes('suspended')) {
          setSignInError('Account temporarily blocked. Please try again later.');
        } else if (lowerError.includes('unverified') || lowerError.includes('verify')) {
          setSignInError('Please verify your email address before signing in.');
        } else {
          setSignInError(errorMessage);
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.message || 'Login failed';
      const lowerError = errorMessage.toLowerCase();
      
      // Handle specific error types
      if (lowerError.includes('auth/invalid-credential')) {
        setSignInError('Wrong password or email. Please check your login details and try again.');
      } else if (lowerError.includes('password')) {
        setPasswordError('Incorrect password. Please try again.');
      } else if (lowerError.includes('email') || lowerError.includes('user') || lowerError.includes('not found')) {
        setEmailError('Email not found. Please check your email or sign up.');
      } else if (lowerError.includes('network') || lowerError.includes('connection')) {
        setSignInError('Network error. Please check your connection and try again.');
      } else if (lowerError.includes('too many') || lowerError.includes('blocked') || lowerError.includes('suspended')) {
        setSignInError('Account temporarily blocked. Please try again later.');
      } else if (lowerError.includes('unverified') || lowerError.includes('verify')) {
        setSignInError('Please verify your email address before signing in.');
      } else {
        setSignInError('An unexpected error occurred. Please try again.');
      }
    } finally {
      // Reset loading state
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <LoadingScreen type="login" />
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.logo}>INCIDENT</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          <View style={styles.form}>
            {signInError ? (
              <View style={styles.signInErrorContainer}>
                <Text style={styles.signInErrorText}>{signInError}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={isDark ? '#888' : '#999'}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError('');
                  setSignInError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor={isDark ? '#888' : '#999'}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setPasswordError('');
                    setSignInError('');
                  }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons 
                    name={showPassword ? 'eye-off' : 'eye'} 
                    size={24} 
                    style={styles.eyeIcon}
                  />
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}
              <TouchableOpacity 
                style={styles.forgotPasswordLink} 
                onPress={() => router.push('/forgot-password')}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don&apos;t have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

