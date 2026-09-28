import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, PanResponder, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LandingScreen() {
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(contentAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [contentAnim]);

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
    <View style={styles.gradient}>
    <Animated.View style={styles.container} {...panResponder.panHandlers}>
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
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.primaryButtonText}>Login</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.push('/signup')}
          >
            <Text style={styles.secondaryButtonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    backgroundColor: '#092e6d',
  },
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
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 50,
    textAlign: 'center',
    // react-native-web deprecated the textShadow* props in favour of the CSS
    // shorthand, which native doesn't understand - so split by platform.
    ...Platform.select({
      web: { textShadow: '1px 1px 2px rgba(0,0,0,0.3)' },
      default: {
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
      },
    }),
  },
  subtitle: {
    fontSize: 18,
    color: '#e0e0ff',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 15,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  secondaryButtonText: {
    color: '#2563eb',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backButton: {
    fontSize: 16,
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
});
