import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface GradientTextProps {
  children: React.ReactNode;
  style?: object;
}

const GradientText = ({ children, style }: GradientTextProps) => {
  return (
    <Text style={[{
      color: '#fff',
      textShadowColor: 'rgba(0,0,0,0.3)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
      letterSpacing: 1.5,
    }, style]}>
      {children}
    </Text>
  );
};

export default function WelcomeScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleGetStarted = () => {
    router.push('/home');
  };
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Warning Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>⚠️</Text>
        </View>

        {/* Title */}
        <Animated.View style={[styles.titleContainer, { opacity: fadeAnim }]}>
          <GradientText style={styles.title}>CAPTURE</GradientText>
          <GradientText style={[styles.title, { color: '#ff5252' }]}>THE</GradientText>
          <GradientText style={styles.title}>HAZARDS</GradientText>
        </Animated.View>

        {/* Paragraphs */}
        <Text style={[styles.paragraph, { fontSize: 13 }]}>Stay Alert. Stay Safe</Text>
        <Text style={[styles.paragraph, { fontSize: 9, marginTop: -20 }]}>identify hazards around you</Text>
        
        {/* Hazard Icons */}
        <View style={styles.iconsRow}>
          <Text style={styles.hazardIcon}>🔥</Text>
          <Text style={styles.hazardIcon}>🌊</Text>
          <Text style={styles.hazardIcon}>⚡</Text>
          <Text style={styles.hazardIcon}>☢️</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button}
            onPress={handleGetStarted}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>
              Already have an account?{' '}
              <Text style={styles.loginLink}>Login</Text>
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0a2e',
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'transparent',
    borderRadius: 24,
    borderWidth: 0,
    padding: 32,
    minHeight: 700,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  iconContainer: {
    marginTop: 48,
    marginBottom: 32,
  },
  icon: {
    fontSize: 64,
  },
  titleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginHorizontal: 4,
    marginBottom: 8,
  },
  paragraph: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  loginContainer: {
    marginTop: 16,
  },
  loginText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
  },
  loginLink: {
    color: '#ffffff',
    textDecorationLine: 'underline',
  },
  iconsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 15,
    gap: 20,
  },
  hazardIcon: {
    fontSize: 24,
    opacity: 0.8,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 30,
  },
});
