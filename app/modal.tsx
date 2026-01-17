import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

export default function AppModal() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: isDark ? '#2a2a2a' : '#fff',
      padding: 20,
      borderRadius: 12,
      width: '80%',
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
      marginBottom: 10,
    },
    modalText: {
      fontSize: 16,
      color: isDark ? '#ccc' : '#666',
      marginBottom: 20,
    },
    closeButton: {
      backgroundColor: '#007AFF',
      padding: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    closeButtonText: {
      color: '#fff',
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Modal Title</Text>
        <Text style={styles.modalText}>This is a modal component.</Text>
        <TouchableOpacity style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}