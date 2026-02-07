import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebCamera from '../components/WebCamera';

export default function SimpleCameraScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const cameraRef = useRef<CameraView>(null);

  // Use WebCamera on web platform
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
        <WebCamera
          onTakePicture={(photo: string) => {
            console.log('📸 WebCamera photo received, navigating to capture-hazard...');
            // Navigate to capture-hazard with the image
            const encodedImage = encodeURIComponent(photo);
            router.push(`/capture-hazard?image=${encodedImage}`);
          }}
          onClose={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
    },
    camera: {
      flex: 1,
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'space-between',
      paddingBottom: 50,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 50,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    title: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '600',
    },
    footer: {
      alignItems: 'center',
      paddingHorizontal: 20,
      backgroundColor: 'rgba(0,0,0,0.5)',
      paddingBottom: 30,
    },
    captureButton: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    captureButtonInner: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: '#ff3b30',
    },
    instructions: {
      color: '#fff',
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 20,
    },
    backButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: 'rgba(255,255,255,0.2)',
    },
    flipButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: 'rgba(255,255,255,0.2)',
    },
    controlsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      paddingHorizontal: 20,
    },
  });

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const handleBack = () => {
    router.back();
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleCapture = async () => {
    if (!cameraRef.current || !isCameraReady) {
      Alert.alert('Error', 'Camera is not ready yet');
      return;
    }

    try {
      console.log('📸 Capturing photo from realtime camera...');
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      console.log('✅ Photo captured:', photo.uri);
      
      // Navigate to capture-hazard with the image
      const encodedImage = encodeURIComponent(photo.uri);
      router.push(`/capture-hazard?image=${encodedImage}`);
      
    } catch (error: any) {
      console.error('❌ Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo: ' + error.message);
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 16 }}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
            We need your permission to use the camera to capture incident photos
          </Text>
          <TouchableOpacity 
            style={{ 
              backgroundColor: '#007AFF', 
              paddingHorizontal: 20, 
              paddingVertical: 12, 
              borderRadius: 8 
            }}
            onPress={requestPermission}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
              Grant Permission
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={{ 
              marginTop: 12,
              paddingHorizontal: 20, 
              paddingVertical: 12, 
              borderRadius: 8 
            }}
            onPress={handleBack}
          >
            <Text style={{ color: '#888', fontSize: 16 }}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Realtime Camera View */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        onCameraReady={() => {
          console.log('📷 Realtime camera is ready');
          setIsCameraReady(true);
        }}
        onMountError={(error) => {
          console.error('❌ Camera mount error:', error);
          Alert.alert('Camera Error', 'Failed to mount camera. Please try again.');
        }}
      />
      
      <View style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Realtime Camera</Text>
          <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
            <Ionicons name="camera-reverse" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.instructions}>
            Position the hazard in the frame and tap to capture
          </Text>
          <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
