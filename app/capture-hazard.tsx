import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LocationModal from '../components/LocationModal';
import { getFirebaseDB } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

export default function CaptureHazardScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Check if photo was passed from real-time camera
  useEffect(() => {
    if (params.photoUri) {
      setImage(params.photoUri as string);
    }
  }, [params.photoUri]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#000' : '#fff',
    },
    header: {
      padding: 10,
      paddingTop: 30,
      backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    backButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#2a2a2a' : '#e9ecef',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
    },
    content: {
      flex: 1,
      padding: 10,
    },
    imageContainer: {
      backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa',
      borderRadius: 8,
      padding: 10,
      marginBottom: 10,
      alignItems: 'center',
    },
    placeholderImage: {
      width: 120,
      height: 120,
      backgroundColor: isDark ? '#3a3a3a' : '#e9ecef',
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    capturedImage: {
      width: 120,
      height: 120,
      borderRadius: 8,
      marginBottom: 8,
    },
    inputGroup: {
      marginBottom: 10,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      marginBottom: 4,
    },
    input: {
      backgroundColor: isDark ? '#3a3a3a' : '#fff',
      borderWidth: 1,
      borderColor: isDark ? '#4a4a4a' : '#dee2e6',
      borderRadius: 6,
      padding: 8,
      fontSize: 14,
      color: isDark ? '#fff' : '#000',
      minHeight: 60,
      textAlignVertical: 'top',
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 10,
    },
    button: {
      flex: 1,
      backgroundColor: '#007AFF',
      padding: 10,
      borderRadius: 6,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: isDark ? '#3a3a3a' : '#e9ecef',
    },
    buttonText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: isDark ? '#fff' : '#000',
    },
    uploadButton: {
      backgroundColor: '#34C759',
      padding: 10,
      borderRadius: 6,
      alignItems: 'center',
    },
    uploadButtonDisabled: {
      backgroundColor: isDark ? '#3a3a3a' : '#e9ecef',
    },
    uploadButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    placeholderText: {
      color: isDark ? '#888' : '#666',
      textAlign: 'center',
    },
    locationButton: {
      backgroundColor: isDark ? '#3a3a3a' : '#fff',
      borderWidth: 1,
      borderColor: isDark ? '#4a4a4a' : '#dee2e6',
      borderRadius: 6,
      padding: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    locationButtonText: {
      fontSize: 14,
      color: isDark ? '#fff' : '#000',
      flex: 1,
    },
  });

  
  
  const uploadPicture = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Photo library permission is required to upload pictures');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error uploading picture:', error);
      Alert.alert('Error', 'Failed to upload picture');
    }
  };

  const uploadHazard = async () => {
    if (!image || !description.trim()) {
      Alert.alert('Error', 'Please take a photo and provide a description');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setIsUploading(true);
    try {
      // Create a unique document ID
      const hazardId = `${user.uid}_${Date.now()}`;
      
      // Save hazard data to Firestore
      const hazardData = {
        id: hazardId,
        userId: user.uid,
        userEmail: user.email,
        imageUrl: image, // In production, you'd upload to Firebase Storage first
        description: description.trim(),
        location: location.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(getFirebaseDB(), 'hazards', hazardId), hazardData);

      Alert.alert('Success', 'Hazard report submitted successfully!');
      router.back();
    } catch (error) {
      console.error('Error uploading hazard:', error);
      Alert.alert('Error', 'Failed to submit hazard report');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Capture Hazard</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.imageContainer}>
          {image ? (
            <Image source={{ uri: image }} style={styles.capturedImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="camera" size={48} color={isDark ? '#888' : '#666'} />
              <Text style={styles.placeholderText}>No photo taken</Text>
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={uploadPicture}>
            <Ionicons name="images" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Upload Picture</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/realtime-camera')}>
            <Ionicons name="videocam" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Take Photo</Text>
          </TouchableOpacity>
          {image && (
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={() => setImage(null)}
            >
              <Ionicons name="trash" size={20} color={isDark ? '#fff' : '#000'} style={{ marginRight: 8 }} />
              <Text style={[styles.buttonText, styles.cancelButtonText]}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the hazard..."
            placeholderTextColor={isDark ? '#888' : '#999'}
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location</Text>
          <TouchableOpacity 
            style={styles.locationButton}
            onPress={() => setShowLocationModal(true)}
          >
            <Text style={styles.locationButtonText}>
              {location || 'Select location...'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={isDark ? '#888' : '#666'} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.uploadButton,
            (!image || !description.trim() || isUploading) && styles.uploadButtonDisabled
          ]}
          onPress={uploadHazard}
          disabled={!image || !description.trim() || isUploading}
        >
          <Text style={styles.uploadButtonText}>
            {isUploading ? 'Uploading...' : 'Submit Hazard Report'}
          </Text>
        </TouchableOpacity>
      </View>

      <LocationModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSelect={(selectedLocation: string) => setLocation(selectedLocation)}
      />
    </SafeAreaView>
  );
}

