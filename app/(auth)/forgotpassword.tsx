import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleResetPassword = async () => {
    if (!email) {
      alert('Please enter your email address');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Firebase password reset logic will go here
      console.log('Reset password for:', email);
      setMessage('Password reset email sent! Check your inbox.');
      
      // Navigate back to login after 2 seconds
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (error) {
      setMessage('Failed to send reset email. Please try again.');
      console.error('Password reset error:', error);
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
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your email to receive reset instructions</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#a0a0a0"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        {message ? <Text style={styles.messageText}>{message}</Text> : null}
        
        <TouchableOpacity 
          style={[styles.resetButton, loading && styles.disabledButton]} 
          onPress={handleResetPassword}
          disabled={loading}
        >
          <Text style={styles.resetButtonText}>
            {loading ? 'Sending...' : 'Send Reset Email'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Back to Login</Text>
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
  resetButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  resetButtonText: {
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
  messageText: {
    color: '#4ade80',
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 14,
  },
});
