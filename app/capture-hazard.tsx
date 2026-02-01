import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useGlobalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';

export default function CaptureHazardScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { user } = useAuth();
  const globalSearchParams = useGlobalSearchParams();
  
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Handle image from camera screen
  useEffect(() => {
    console.log('🔍 Checking for image parameter...');
    console.log('📦 Global search params:', globalSearchParams);
    
    const imageParam = globalSearchParams.image as string;
    console.log('📸 Image param found:', imageParam);
    
    if (imageParam) {
      const decodedImage = decodeURIComponent(imageParam);
      console.log('📸 Setting image state to:', decodedImage);
      setImage(decodedImage);
      console.log('✅ Image received from camera:', decodedImage);
    } else {
      console.log('❌ No image parameter found');
    }
  }, [globalSearchParams.image]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#000' : '#fff',
    },
    header: {
      padding: 20,
      paddingTop: 40,
      backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa',
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: isDark ? '#888' : '#666',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      marginBottom: 8,
    },
    input: {
      backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa',
      padding: 16,
      borderRadius: 12,
      fontSize: 16,
      color: isDark ? '#fff' : '#000',
      borderWidth: 1,
      borderColor: isDark ? '#444' : '#e0e0e0',
      minHeight: 100,
      textAlignVertical: 'top',
    },
    imageContainer: {
      marginBottom: 20,
    },
    imagePreview: {
      width: '100%',
      height: 200,
      borderRadius: 12,
      backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    previewImage: {
      width: '100%',
      height: '100%',
      borderRadius: 12,
    },
    placeholderText: {
      color: isDark ? '#888' : '#666',
      fontSize: 14,
    },
    button: {
      backgroundColor: '#007AFF',
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 12,
    },
    secondaryButton: {
      backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa',
      borderWidth: 1,
      borderColor: isDark ? '#444' : '#e0e0e0',
    },
    galleryButton: {
      backgroundColor: '#34C759', // Green for gallery
      borderWidth: 1,
      borderColor: '#34C759',
    },
    cameraButton: {
      backgroundColor: '#FF9500', // Orange for camera
      borderWidth: 1,
      borderColor: '#FF9500',
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryButtonText: {
      color: isDark ? '#fff' : '#000',
      fontSize: 16,
      fontWeight: '600',
    },
    locationInfo: {
      backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa',
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
    },
    locationText: {
      fontSize: 14,
      color: isDark ? '#ccc' : '#666',
    },
    backButton: {
      position: 'absolute',
      top: 40,
      left: 20,
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#2a2a2a' : '#e9ecef',
    },
  });

  const pickImage = async () => {
    try {
      console.log('📷 Opening photo gallery for selection...');
      
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow access to your photo library to select existing images');
        return;
      }

      // Configure for gallery selection (different from camera)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, // Allow editing for gallery photos
        aspect: [4, 3], // Standard aspect for gallery photos
        quality: 0.8, // Good quality for gallery photos
      });

      console.log('📷 Gallery selection result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('✅ Photo selected from gallery:', result.assets[0].uri);
        console.log('📊 Gallery photo info:', {
          width: result.assets[0].width,
          height: result.assets[0].height,
          fileSize: result.assets[0].fileSize,
          type: result.assets[0].mimeType
        });
        
        setImage(result.assets[0].uri);
        
        // Show gallery-specific feedback
        Alert.alert(
          '📷 Photo Selected!',
          `Photo selected from gallery successfully!\n\nDetails:\n• Resolution: ${result.assets[0]?.width || 'Unknown'}x${result.assets[0]?.height || 'Unknown'}\n• File size: ${result.assets[0]?.fileSize ? `${(result.assets[0].fileSize / 1024).toFixed(1)}KB` : 'Unknown'}\n• Type: ${result.assets[0]?.mimeType || 'Unknown'}\n\nYou can now submit your hazard report.`,
          [{ text: 'OK' }]
        );
      } else {
        console.log('❌ Gallery selection cancelled');
      }
    } catch (error: any) {
      console.error('❌ Error selecting photo from gallery:', error);
      Alert.alert('Error', 'Failed to select photo from gallery: ' + error.message);
    }
  };

  const handleOpenCamera = async () => {
    // Navigate to the simple camera screen for quick upload
    router.push('/simple-camera');
  };

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to capture incident location');
        return;
      }

      const locationData = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: locationData.coords.latitude,
        longitude: locationData.coords.longitude,
      });
      
      // For demo purposes, set a readable location string
      setLocation(`Lat: ${locationData.coords.latitude.toFixed(6)}, Lng: ${locationData.coords.longitude.toFixed(6)}`);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description of the incident');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to report an incident');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🔥 Starting incident submission process...');
      
      // Get existing reports from localStorage
      const existingReports = JSON.parse(localStorage.getItem('incident_reports') || '[]');
      
      // Create new incident report
      const newReport = {
        id: 'incident_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        user: {
          name: user.displayName || 'Anonymous User',
          email: user.email || 'No email',
          uid: user.uid || 'unknown'
        },
        description: description.trim(),
        image: image || null,
        location: currentLocation || null,
        timestamp: new Date().toISOString(),
        status: 'pending' as const,
        adminNotes: null
      };
      
      console.log('📝 Incident report data:', newReport);
      
      // Add to existing reports
      existingReports.push(newReport);
      
      // Save to localStorage
      localStorage.setItem('incident_reports', JSON.stringify(existingReports));
      
      console.log('✅ Incident report submitted successfully with ID:', newReport.id);

      Alert.alert(
        '✅ Success!',
        'Incident report submitted successfully!\n\n• Report saved to system\n• Admin will review it shortly\n• You can view status in "My Reports"',
        [
          {
            text: 'View My Reports',
            onPress: () => router.push('/dashboard'),
          },
          {
            text: 'Submit Another',
            onPress: () => {
              setDescription('');
              setImage(null);
              setCurrentLocation(null);
            },
          },
          {
            text: 'Go to Dashboard',
            onPress: () => router.push('/dashboard'),
            style: 'cancel'
          },
        ]
      );
      
      // Reset form
      setDescription('');
      setImage(null);
      setCurrentLocation(null);
      
    } catch (error: any) {
      console.error('❌ Error submitting incident:', error);
      Alert.alert('Submission Error', 'Failed to submit incident report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Capture Incident</Text>
        <Text style={styles.subtitle}>Report safety incidents in your area</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={styles.input}
            placeholder="Describe the incident in detail..."
            placeholderTextColor={isDark ? '#888' : '#999'}
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>

        <View style={styles.imageContainer}>
          <Text style={styles.label}>Photo Evidence *</Text>
          <View style={styles.imagePreview}>
            {image ? (
              <>
                <Image source={{ uri: image }} style={styles.previewImage} />
                <Text style={{ fontSize: 12, color: '#007AFF', marginTop: 4 }}>✅ Image loaded</Text>
              </>
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Ionicons name="camera" size={48} color={isDark ? '#444' : '#ccc'} />
                <Text style={styles.placeholderText}>No image selected</Text>
                <Text style={{ fontSize: 10, color: '#888', marginTop: 4 }}>Debug: image state = {image ? 'SET' : 'NULL'}</Text>
              </View>
            )}
          </View>
          
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity 
              style={[styles.button, styles.galleryButton, { flex: 1 }]} 
              onPress={pickImage}
            >
              <Text style={styles.buttonText}>
                📷 Choose from Gallery
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.cameraButton, { flex: 1 }]} 
              onPress={handleOpenCamera}
            >
              <Text style={styles.buttonText}>
                📸 Take Photo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton, { flex: 1 }]} 
              onPress={getCurrentLocation}
            >
              <Text style={styles.secondaryButtonText}>
                📍 Get Current Location
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {currentLocation && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationText}>
              📍 Current GPS: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            </Text>
          </View>
        )}

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Submitting...' : 'Submit Incident Report to Admin'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
