import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, PanResponder, StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function WelcomeScreen() {
  const splashAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Splash animation sequence
    Animated.sequence([
      Animated.timing(splashAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(splashAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 10;
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx > 50) {
        // Swipe right - go back
        router.back();
      }
    },
  });

  return (
    <Animated.View style={styles.container} {...panResponder.panHandlers}>
      {/* Splash Effect */}
      <Animated.View 
        style={[
          styles.splashOverlay,
          {
            opacity: splashAnim,
            transform: [
              {
                scale: splashAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2],
                }),
              },
            ],
          },
        ]}
      >
        <Animated.View style={styles.splashCircle} />
      </Animated.View>
      
      {/* Content */}
      <Animated.View
        style={{
          opacity: contentAnim,
          transform: [
            {
              translateY: contentAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        }}
      >
        <Text style={styles.title}>Welcome to Your Landing Page</Text>
        <Text style={styles.subtitle}>This is where users land after clicking Get Started</Text>
        
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.signupButton}
          onPress={() => router.push('/signup')}
        >
          <Text style={styles.signupButtonText}>Sign Up</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingTop: 80,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: '#fff',
    marginBottom: 50,
    textAlign: 'center' as const,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 18,
    color: '#e0e0ff',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  backButton: {
    fontSize: 16,
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
  splashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.3)',
    zIndex: 1,
  },
  splashCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  loginButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  signupButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 15,
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  signupButtonText: {
    color: '#2563eb',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
