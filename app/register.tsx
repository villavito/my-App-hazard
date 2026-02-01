import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
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
import { useAuth } from '../contexts/AuthContext';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';

  // Validation states
  const [emailError, setEmailError] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [emailValid, setEmailValid] = useState(false);
  const [firstNameValid, setFirstNameValid] = useState(false);
  const [lastNameValid, setLastNameValid] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);
  const [confirmPasswordValid, setConfirmPasswordValid] = useState(false);

  // Validation functions
  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError('Email is required');
      setEmailValid(false);
      return false;
    }
    
    // Enhanced email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      setEmailValid(false);
      return false;
    }
    
    // Additional checks
    if (email.includes('..')) {
      setEmailError('Email cannot contain consecutive dots');
      setEmailValid(false);
      return false;
    }
    
    if (email.startsWith('.') || email.endsWith('.')) {
      setEmailError('Email cannot start or end with a dot');
      setEmailValid(false);
      return false;
    }
    
    setEmailError('');
    setEmailValid(true);
    return true;
  };

  const validateFirstName = (name: string) => {
    if (!name) {
      setFirstNameError('First name is required');
      setFirstNameValid(false);
      return false;
    }
    
    if (name.length < 2) {
      setFirstNameError('First name must be at least 2 character');
      setFirstNameValid(false);
      return false;
    }
    
    if (name.length > 25) {
      setFirstNameError('First name must be less than 25 characters');
      setFirstNameValid(false);
      return false;
    }
    
    // Check for invalid characters and suggest corrections
    const invalidChars = name.match(/[^a-zA-Z\-']/g);
    if (invalidChars) {
      const cleanName = name.replace(/[^a-zA-Z\-']/g, '');
      setFirstNameError(`Remove special characters: ${invalidChars.join(', ')}. Try: "${cleanName}"`);
      setFirstNameValid(false);
      return false;
    }
    
    // Check for consecutive special characters
    if (name.includes('--') || name.includes("''")) {
      setFirstNameError('Remove consecutive hyphens or apostrophes');
      setFirstNameValid(false);
      return false;
    }
    
    // Check if starts or ends with special character
    if (name.startsWith('-') || name.startsWith("'") || name.endsWith('-') || name.endsWith("'")) {
      const cleanName = name.replace(/^[-']+|[-']+$/g, '');
      setFirstNameError(`Name cannot start/end with hyphen or apostrophe. Try: "${cleanName}"`);
      setFirstNameValid(false);
      return false;
    }
    
    setFirstNameError('');
    setFirstNameValid(true);
    return true;
  };

  const validateLastName = (name: string) => {
    if (!name) {
      setLastNameError('Last name is required');
      setLastNameValid(false);
      return false;
    }
    
    if (name.length < 2) {
      setLastNameError('Last name must be at least 2 characters');
      setLastNameValid(false);
      return false;
    }
    
    if (name.length > 25) {
      setLastNameError('Last name must be less than 25 characters');
      setLastNameValid(false);
      return false;
    }
    
    // Check for invalid characters and suggest corrections
    const invalidChars = name.match(/[^a-zA-Z\-']/g);
    if (invalidChars) {
      const cleanName = name.replace(/[^a-zA-Z\-']/g, '');
      setLastNameError(`Remove special characters: ${invalidChars.join(', ')}. Try: "${cleanName}"`);
      setLastNameValid(false);
      return false;
    }
    
    // Check for consecutive special characters
    if (name.includes('--') || name.includes("''")) {
      setLastNameError('Remove consecutive hyphens or apostrophes');
      setLastNameValid(false);
      return false;
    }
    
    // Check if starts or ends with special character
    if (name.startsWith('-') || name.startsWith("'") || name.endsWith('-') || name.endsWith("'")) {
      const cleanName = name.replace(/^[-']+|[-']+$/g, '');
      setLastNameError(`Name cannot start/end with hyphen or apostrophe. Try: "${cleanName}"`);
      setLastNameValid(false);
      return false;
    }
    
    setLastNameError('');
    setLastNameValid(true);
    return true;
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('Password is required');
      setPasswordValid(false);
      return false;
    }
    
    if (password.length < 8) {
      setPasswordError(`Password must be at least 8 characters (currently ${password.length}). Add ${8 - password.length} more characters.`);
      setPasswordValid(false);
      return false;
    }
    
    // Check password requirements with specific feedback
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const missing = [];
    if (!hasUpperCase) missing.push('uppercase letter (A-Z)');
    if (!hasLowerCase) missing.push('lowercase letter (a-z)');
    if (!hasNumbers) missing.push('number (0-9)');
    if (!hasSpecialChar) missing.push('special character (!@#$%^&*)');

    if (missing.length > 0) {
      // Generate specific correction suggestions
      const suggestions = [];
      const baseName = firstName || 'User';
      
      if (!hasUpperCase) {
        suggestions.push(`Add uppercase: ${baseName.charAt(0).toUpperCase()}${baseName.slice(1)}`);
      }
      if (!hasLowerCase) {
        suggestions.push(`Add lowercase: ${baseName.toLowerCase()}`);
      }
      if (!hasNumbers) {
        suggestions.push(`Add numbers: ${baseName}123`);
      }
      if (!hasSpecialChar) {
        suggestions.push(`Add special: ${baseName}! or ${baseName}@`);
      }
      
      setPasswordError(`Missing: ${missing.join(', ')}. Try: ${suggestions.join(' or ')}`);
      setPasswordValid(false);
      return false;
    }
    
    // Check for common weak patterns
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /abc123/i,
      /(.)\1{2,}/ // Repeated characters
    ];
    
    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        setPasswordError('Password is too common. Use a more unique combination.');
        setPasswordValid(false);
        return false;
      }
    }
    
    setPasswordError('');
    setPasswordValid(true);
    return true;
  };

  const validateConfirmPassword = (confirmPassword: string) => {
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      setConfirmPasswordValid(false);
      return false;
    }
    
    if (!password) {
      setConfirmPasswordError('Please enter a password first');
      setConfirmPasswordValid(false);
      return false;
    }
    
    if (confirmPassword !== password) {
      // Check how different the passwords are
      if (confirmPassword.length !== password.length) {
        setConfirmPasswordError(`Passwords don't match. Password has ${password.length} characters, confirmation has ${confirmPassword.length}.`);
      } else {
        // Find the first different character
        let firstDiff = -1;
        for (let i = 0; i < Math.min(password.length, confirmPassword.length); i++) {
          if (password[i] !== confirmPassword[i]) {
            firstDiff = i;
            break;
          }
        }
        
        if (firstDiff >= 0) {
          setConfirmPasswordError(`Passwords don't match at character ${firstDiff + 1}. Check "${confirmPassword[firstDiff]}" should be "${password[firstDiff]}".`);
        } else {
          setConfirmPasswordError('Passwords do not match exactly. Please retype carefully.');
        }
      }
      setConfirmPasswordValid(false);
      return false;
    }
    
    setConfirmPasswordError('');
    setConfirmPasswordValid(true);
    return true;
  };

  // Real-time validation handlers
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (text) validateEmail(text);
  };

  const handleFirstNameChange = (text: string) => {
    setFirstName(text);
    if (text) validateFirstName(text);
  };

  const handleLastNameChange = (text: string) => {
    setLastName(text);
    if (text) validateLastName(text);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (text) validatePassword(text);
    // Re-validate confirm password if it has a value
    if (confirmPassword) validateConfirmPassword(confirmPassword);
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (text) validateConfirmPassword(text);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#0a0a0a' : '#f5f5f5',
    },
    scrollView: {
      flex: 1,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      padding: 20,
      maxWidth: 400,
      width: '100%',
      alignSelf: 'center',
    },
    header: {
      alignItems: 'center',
      marginBottom: 40,
    },
    logo: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#007AFF',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: isDark ? '#888' : '#666',
      textAlign: 'center',
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
      backgroundColor: isDark ? '#1a1a1a' : '#fff',
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#e0e0e0',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: isDark ? '#fff' : '#000',
    },
    passwordContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1a1a1a' : '#fff',
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#e0e0e0',
      borderRadius: 8,
    },
    passwordInput: {
      flex: 1,
      padding: 12,
      fontSize: 16,
      color: isDark ? '#fff' : '#000',
    },
    eyeIcon: {
      padding: 12,
      color: isDark ? '#888' : '#666',
    },
    button: {
      backgroundColor: '#007AFF',
      padding: 14,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 20,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    loginLink: {
      alignItems: 'center',
    },
    loginText: {
      color: isDark ? '#888' : '#666',
      fontSize: 14,
    },
    loginLinkText: {
      color: '#007AFF',
      fontSize: 14,
      fontWeight: '600',
    },
    errorText: {
      color: '#FF3B30',
      fontSize: 14,
      marginTop: 5,
    },
    requirementsText: {
      color: isDark ? '#888' : '#666',
      fontSize: 12,
      marginTop: 5,
      lineHeight: 16,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    loadingContent: {
      backgroundColor: isDark ? '#1a1a1a' : '#fff',
      padding: 30,
      borderRadius: 12,
      alignItems: 'center',
    },
    loadingText: {
      color: isDark ? '#fff' : '#000',
      fontSize: 16,
      fontWeight: '600',
      marginTop: 15,
    },
    loadingSubtext: {
      color: isDark ? '#888' : '#666',
      fontSize: 14,
      marginTop: 5,
    },
    validationIndicator: {
      position: 'absolute',
      right: -40,
      top: '50%',
      marginTop: -10,
    },
    validInput: {
      borderColor: '#34C759',
      borderWidth: 2,
    },
    invalidInput: {
      borderColor: '#FF3B30',
      borderWidth: 2,
    },
    inputWithValidation: {
      position: 'relative',
      flexDirection: 'row',
      alignItems: 'center',
    },
  });

  const handleRegister = async () => {
    console.log('🔘 Register button clicked!');
    console.log('📝 Form data:', { email, password, confirmPassword, firstName, lastName });
    
    // Validate all fields
    const isEmailValid = validateEmail(email);
    const isFirstNameValid = validateFirstName(firstName);
    const isLastNameValid = validateLastName(lastName);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);
    
    if (!isEmailValid || !isFirstNameValid || !isLastNameValid || !isPasswordValid || !isConfirmPasswordValid) {
      console.log('❌ Validation failed: One or more fields are invalid');
      Alert.alert('Error', 'Please fix all validation errors before proceeding');
      return;
    }

    // Combine first and last name for display name
    const displayName = `${firstName} ${lastName}`;

    console.log('✅ Validation passed, proceeding with registration...');
    console.log('👤 Creating user account');
    setLoading(true);

    try {
      console.log('🚀 Starting registration process...');
      const result = await signUp(email, password, displayName, 'user');
      console.log('📝 Registration result received:', result);
      
      if (result.success) {
        console.log('✅ Registration successful! Showing success alert...');
        Alert.alert(
          'User Created Successfully', 
          'Your account has been created successfully!\n\nRedirecting to sign in page...',
          [
            {
              text: 'OK',
              onPress: () => {
                console.log('🔄 Redirecting to login...');
                router.push('/login');
              }
            }
          ]
        );
      } else {
        console.log('❌ Registration failed:', result.error);
        
        // Check if the error is about existing account
        if (result.error && result.error.toLowerCase().includes('already exists') || result.error.toLowerCase().includes('already taken')) {
          Alert.alert('Account Already Exists', 'An account with this email already exists. Please sign in instead.');
        } else {
          Alert.alert('User Failed Created Successfully', result.error || 'Registration failed. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('❌ Registration error caught:', error);
      Alert.alert('Registration Error', error.message || 'Something went wrong. Please try again.');
    } finally {
      console.log('🏁 Registration process finished, setting loading to false');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.logo}>INCIDENT</Text>
            <Text style={styles.subtitle}>Create your account</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name</Text>
            <View style={styles.inputWithValidation}>
              <TextInput
                style={[
                  styles.input,
                  firstNameValid && styles.validInput,
                  firstNameError && styles.invalidInput,
                  { flex: 1 }
                ]}
                placeholder="Enter your first name"
                placeholderTextColor={isDark ? '#888' : '#999'}
                value={firstName}
                onChangeText={handleFirstNameChange}
                autoCapitalize="words"
              />
              {firstName && (
                <View style={styles.validationIndicator}>
                  <Ionicons 
                    name={firstNameValid ? 'checkmark-circle' : 'close-circle'} 
                    size={20} 
                    color={firstNameValid ? '#34C759' : '#FF3B30'} 
                  />
                </View>
              )}
            </View>
            {firstNameError ? (
              <Text style={styles.errorText}>{firstNameError}</Text>
            ) : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            <View style={styles.inputWithValidation}>
              <TextInput
                style={[
                  styles.input,
                  lastNameValid && styles.validInput,
                  lastNameError && styles.invalidInput,
                  { flex: 1 }
                ]}
                placeholder="Enter your last name"
                placeholderTextColor={isDark ? '#888' : '#999'}
                value={lastName}
                onChangeText={handleLastNameChange}
                autoCapitalize="words"
              />
              {lastName && (
                <View style={styles.validationIndicator}>
                  <Ionicons 
                    name={lastNameValid ? 'checkmark-circle' : 'close-circle'} 
                    size={20} 
                    color={lastNameValid ? '#34C759' : '#FF3B30'} 
                  />
                </View>
              )}
            </View>
            {lastNameError ? (
              <Text style={styles.errorText}>{lastNameError}</Text>
            ) : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWithValidation}>
              <TextInput
                style={[
                  styles.input,
                  emailValid && styles.validInput,
                  emailError && styles.invalidInput,
                  { flex: 1 }
                ]}
                placeholder="Enter your email"
                placeholderTextColor={isDark ? '#888' : '#999'}
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {email && (
                <View style={styles.validationIndicator}>
                  <Ionicons 
                    name={emailValid ? 'checkmark-circle' : 'close-circle'} 
                    size={20} 
                    color={emailValid ? '#34C759' : '#FF3B30'} 
                  />
                </View>
              )}
            </View>
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWithValidation}>
              <View style={[
                styles.passwordContainer,
                passwordValid && styles.validInput,
                passwordError && styles.invalidInput,
                { flex: 1 }
              ]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor={isDark ? '#888' : '#999'}
                  value={password}
                  onChangeText={handlePasswordChange}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons 
                    name={showPassword ? 'eye-off' : 'eye'} 
                    size={20} 
                    style={styles.eyeIcon}
                  />
                </TouchableOpacity>
              </View>
              {password && (
                <View style={styles.validationIndicator}>
                  <Ionicons 
                    name={passwordValid ? 'checkmark-circle' : 'close-circle'} 
                    size={20} 
                    color={passwordValid ? '#34C759' : '#FF3B30'} 
                  />
                </View>
              )}
            </View>
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : (
              <Text style={styles.requirementsText}>
                Password must contain: 8+ chars, uppercase, lowercase, number, special character
              </Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputWithValidation}>
              <View style={[
                styles.passwordContainer,
                confirmPasswordValid && styles.validInput,
                confirmPasswordError && styles.invalidInput,
                { flex: 1 }
              ]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm your password"
                  placeholderTextColor={isDark ? '#888' : '#999'}
                  value={confirmPassword}
                  onChangeText={handleConfirmPasswordChange}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons 
                    name={showConfirmPassword ? 'eye-off' : 'eye'} 
                    size={20} 
                    style={styles.eyeIcon}
                  />
                </TouchableOpacity>
              </View>
              {confirmPassword && (
                <View style={styles.validationIndicator}>
                  <Ionicons 
                    name={confirmPasswordValid ? 'checkmark-circle' : 'close-circle'} 
                    size={20} 
                    color={confirmPasswordValid ? '#34C759' : '#FF3B30'} 
                  />
                </View>
              )}
            </View>
            {confirmPasswordError ? (
              <Text style={styles.errorText}>{confirmPasswordError}</Text>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.6 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <View style={styles.loginLink}>
            <Text style={styles.loginText}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.loginLinkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <Ionicons name="sync" size={40} color="#007AFF" />
            <Text style={styles.loadingText}>Creating Account...</Text>
            <Text style={styles.loadingSubtext}>
              Setting up your user account
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
