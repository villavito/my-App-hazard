import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import SwipeableScreen from '../../components/SwipeableScreen';

export default function HomeScreen() {
  const handleGoBack = () => {
    router.back();
  };

  return (
    <SwipeableScreen onSwipeRight={handleGoBack}>
      <View style={styles.homeContent}>
        <Text style={styles.homeTitle}>Welcome to Hazard App</Text>
        <Text style={styles.homeSubtitle}>Swipe right to go back</Text>
      </View>
    </SwipeableScreen>
  );
}

const styles = StyleSheet.create({
  homeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  homeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 40,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginTop: -100,
  },
  homeSubtitle: {
    fontSize: 18,
    color: '#e0e0ff',
    textAlign: 'center',
    lineHeight: 24,
  },
});