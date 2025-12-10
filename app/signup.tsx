import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// import { createUserWithEmailAndPassword, auth, db, doc, setDoc } from '../config/firebase';

export default function SignupScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Firebase signup logic - uncomment after installing Firebase
      // const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // const user = userCredential.user;
      
      // Save user data to Firestore
      // await setDoc(doc(db, 'users', user.uid), {
      //   fullName,
      //   email,
      //   createdAt: new Date().toISOString(),
      // });
      
      console.log('Signup successful');
      
      // Navigate to tabs/home after successful signup
      router.push('/');
    } catch (error: any) {
      setError(error.message || 'Signup failed. Please try again.');
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#999"
          value={fullName}
          onChangeText={setFullName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#999"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        <TouchableOpacity 
          style={[styles.signupButton, loading && styles.disabledButton]} 
          onPress={handleSignup}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#fff',
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  signupButton: {
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backText: {
    color: '#60a5fa',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
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
