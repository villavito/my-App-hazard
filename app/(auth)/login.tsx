import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// import { signInWithEmailAndPassword, auth } from '../../config/firebase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Basic validation for demo purposes - remove when Firebase is installed
      if (email === 'demo@example.com' && password === 'password') {
        console.log('Login successful');
        
        // Navigate to tabs/home after successful login
        router.push('/');
      } else {
        setError('Invalid email or password. Use demo@example.com / password');
      }
    } catch (error: any) {
      setError(error.message || 'Login failed. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.formContainer}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Please sign in to continue</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#a0a0a0"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#a0a0a0"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        <TouchableOpacity 
          style={[styles.loginButton, loading && styles.disabledButton]} 
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => router.push('/(auth)/forgotpassword')} 
          style={styles.forgotPasswordButton}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Back to Welcome</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  formContainer: {
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
    padding: 25,
    borderRadius: 15,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
    color: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  loginButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
  },
  backText: {
    color: '#60a5fa',
    fontSize: 14,
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginBottom: 10,
  },
  forgotPasswordText: {
    color: '#60a5fa',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 14,
  },
  disabledButton: {
    backgroundColor: '#666',
  },
});
