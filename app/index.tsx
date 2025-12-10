import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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

export default function App() {
  const [showHome, setShowHome] = useState(false);
  
  // Create animated values for each element
  const titleAnim = useRef(new Animated.Value(0)).current;
  const text1Anim = useRef(new Animated.Value(0)).current;
  const text2Anim = useRef(new Animated.Value(0)).current;
  const iconsAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const loginAnim = useRef(new Animated.Value(0)).current;

  // Animation sequence
  useEffect(() => {
    const animations = [
      Animated.sequence([
        Animated.delay(300),
        Animated.timing(titleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        })
      ]),
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(text1Anim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        })
      ]),
      Animated.sequence([
        Animated.delay(700),
        Animated.timing(text2Anim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        })
      ]),
      Animated.sequence([
        Animated.delay(1000),
        Animated.spring(iconsAnim, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        })
      ]),
      Animated.sequence([
        Animated.delay(1300),
        Animated.spring(buttonAnim, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        })
      ]),
      Animated.sequence([
        Animated.delay(1600),
        Animated.timing(loginAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        })
      ])
    ];

    Animated.stagger(100, animations).start();
  }, []);

  
  const handleGetStarted = () => {
    router.push('/welcome');
  };
  return (
    <LinearGradient
      colors={['#000000', '#092e6dff', '#403673ff', '#ffffff']}
      style={styles.gradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <View style={styles.container}>
        <View style={styles.card}>
          {/* Warning Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>⚠️</Text>
          </View>

          {/* Title */}
          <Animated.View style={[styles.titleContainer, {
            opacity: titleAnim,
            transform: [{
              translateY: titleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0]
              })
            }]
          }]}>
            <GradientText style={styles.title}>CAPTURE</GradientText>
            <GradientText style={[styles.title, { color: 'hsla(284, 93%, 76%, 1.00)' }]}>THE</GradientText>
            <GradientText style={styles.title}>HAZARDS</GradientText>
          </Animated.View>

          {/* Paragraphs */}
          <Animated.Text style={[styles.paragraph, { 
            fontSize: 13,
            opacity: text1Anim,
            transform: [{
              translateX: text1Anim.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0]
              })
            }]
          }]}>Stay Alert. Stay Safe</Animated.Text>
          
          <Animated.Text style={[styles.paragraph, { 
            fontSize: 9, 
            marginTop: -20,
            opacity: text2Anim,
            transform: [{
              translateX: text2Anim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0]
              })
            }]
          }]}>identify hazards around you</Animated.Text>
          
          {/* Hazard Icons */}
          <Animated.View style={[styles.iconsRow, {
            opacity: iconsAnim,
            transform: [{
              scale: iconsAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1]
              })
            }]
          }]}>
            <Text style={styles.hazardIcon}>🔥</Text>
            <Text style={styles.hazardIcon}>🌊</Text>
            <Text style={styles.hazardIcon}>⚡</Text>
            <Text style={styles.hazardIcon}>☢️</Text>
          </Animated.View>

          <Animated.View style={[styles.buttonContainer, {
            opacity: buttonAnim,
            transform: [{
              translateY: buttonAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0]
              })
            }]
          }]}>
                        
            <TouchableOpacity 
              style={[styles.button, {
                opacity: buttonAnim,
                transform: [{
                  scale: buttonAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.8, 1.1, 1]
                  })
                }]
              }]}
              onPress={handleGetStarted}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
            
            <Animated.View style={[styles.loginContainer, {
              opacity: loginAnim,
            }]}>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.loginText}>
                  Already have an account?{' '}
                  <Text style={styles.loginLink}>Login</Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
  // Home screen content
  homeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  homeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  homeSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
