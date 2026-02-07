import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

interface WebCameraProps {
  onTakePicture: (photo: string) => void;
  onClose: () => void;
}

export default function WebCamera({ onTakePicture, onClose }: WebCameraProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);

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
      backgroundColor: '#FF3B30',
      justifyContent: 'center',
      alignItems: 'center',
    },
    switchButton: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      padding: 10,
      borderRadius: 20,
    },
    placeholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    placeholderText: {
      color: '#fff',
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 20,
    },
    fallbackButton: {
      backgroundColor: '#007AFF',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
    },
    fallbackButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      Alert.alert(
        'Camera Error',
        'Unable to access camera. Please use the file picker instead.',
        [
          {
            text: 'Use File Picker',
            onPress: () => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.capture = 'environment';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const dataUrl = e.target?.result as string;
                    console.log('📁 File selected from picker');
                    onTakePicture(dataUrl);
                  };
                  reader.readAsDataURL(file);
                }
              };
              input.click();
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    }
  };

  const takePicture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        console.log('📸 Web camera photo captured successfully');
        
        // Stop the camera stream
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        
        // Pass the captured image back and navigate to capture-hazard
        onTakePicture(dataUrl);
      }
    }
  };

  React.useEffect(() => {
    startCamera();
    
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={styles.camera}
      />
      
      <View style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Camera</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={takePicture}
          >
            <View style={styles.captureButtonInner}>
              <Ionicons name="camera" size={30} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
