import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import LogoutButton from '../../components/LogoutButton';

export default function HomeScreen() {
  return (
    <LinearGradient
      colors={['#000000', '#092e6d', '#403673']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Hazard Alert</Text>
        <Text style={styles.subtitle}>You are now logged in!</Text>
        <LogoutButton />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#a0a0a0',
    textAlign: 'center',
  },
});
