import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

const AGENCY_SITUATIONS: Record<string, string[]> = {
  PNP: [
    'Theft / Robbery',
    'Assault / Physical Violence',
    'Domestic Violence',
    'Vandalism / Property Damage',
    'Missing Person',
    'Disturbance / Public Disorder',
    'Drug-related Incident',
    'Traffic Accident (Police Response)',
    'Other Crime / Police Matter',
  ],
  BFP: [
    'Building Fire',
    'Forest / Grass Fire',
    'Vehicle Fire',
    'Explosion',
    'Smoke / Gas Leak',
    'Fire Alarm Activation',
    'Rescue Operation',
    'Other Fire Emergency',
  ],
  RHU: [
    'Injury / Trauma',
    'Illness / Medical Emergency',
    'Childbirth Emergency',
    'Poisoning / Overdose',
    'Animal Bite',
    'Heat Stroke / Dehydration',
    'Mental Health Crisis',
    'Other Health Emergency',
  ],
  BDRRMC: [
    'Flood',
    'Landslide',
    'Earthquake',
    'Typhoon / Storm Damage',
    'Evacuation Needed',
    'Structural Collapse',
    'Power Outage (Disaster-related)',
    'Search and Rescue',
    'Other Disaster / Emergency',
  ],
};

const INJURY_LEVEL_OPTIONS = [
  'No Injury',
  'Minor (First Aid)',
  'Moderate (Medical Attention)',
  'Serious (Hospitalization)',
  'Critical (Life-threatening)',
  'Fatality',
];

type DropdownFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  onSelect: (value: string) => void;
  isDark: boolean;
};

function DropdownField({ label, value, placeholder, options, onSelect, isDark }: DropdownFieldProps) {
  const [visible, setVisible] = useState(false);

  const styles = StyleSheet.create({
    inputGroup: {
      marginBottom: 10,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      marginBottom: 4,
    },
    dropdownButton: {
      backgroundColor: isDark ? '#3a3a3a' : '#fff',
      borderWidth: 1,
      borderColor: isDark ? '#4a4a4a' : '#dee2e6',
      borderRadius: 6,
      padding: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dropdownButtonText: {
      fontSize: 14,
      color: value ? (isDark ? '#fff' : '#000') : (isDark ? '#888' : '#999'),
      flex: 1,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: isDark ? '#1a1a1a' : '#fff',
      borderRadius: 12,
      width: '90%',
      maxHeight: '70%',
      padding: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : '#eee',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
    },
    closeButton: {
      fontSize: 24,
      color: isDark ? '#fff' : '#000',
      fontWeight: 'bold',
    },
    optionItem: {
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#2a2a2a' : '#f0f0f0',
    },
    optionText: {
      fontSize: 14,
      color: isDark ? '#fff' : '#000',
    },
    selectedOptionText: {
      color: '#007AFF',
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.dropdownButton} onPress={() => setVisible(true)}>
        <Text style={styles.dropdownButtonText}>{value || placeholder}</Text>
        <Ionicons name="chevron-down" size={16} color={isDark ? '#888' : '#666'} />
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Text style={styles.closeButton}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.optionItem}
                  onPress={() => {
                    onSelect(option);
                    setVisible(false);
                  }}
                >
                  <Text style={[styles.optionText, value === option && styles.selectedOptionText]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function CaptureIncidentScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const [image, setImage] = useState<string | null>(null);
  const [agency, setAgency] = useState('');
  const [situation, setSituation] = useState('');
  const [injuryLevel, setInjuryLevel] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

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
      flexDirection: 'row',
      justifyContent: 'center',
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
      marginBottom: 24,
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
    locationSection: {
      marginBottom: 10,
    },
    locationLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      marginBottom: 4,
    },
    locationButton: {
      backgroundColor: '#007AFF',
      padding: 12,
      borderRadius: 6,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    locationButtonDisabled: {
      opacity: 0.7,
    },
    locationButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    locationResult: {
      marginTop: 8,
      backgroundColor: isDark ? '#3a3a3a' : '#f8f9fa',
      borderWidth: 1,
      borderColor: isDark ? '#4a4a4a' : '#dee2e6',
      borderRadius: 6,
      padding: 10,
    },
    locationResultText: {
      fontSize: 13,
      color: isDark ? '#fff' : '#000',
      lineHeight: 18,
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      marginBottom: 8,
    },
  });

  const handleAgencySituationSelect = (selectedAgency: string, selectedSituation: string) => {
    setAgency(selectedAgency);
    setSituation(selectedSituation);
  };

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  };

  const takePicture = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Camera permission is required to take photos');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 1.0,
        cameraType: ImagePicker.CameraType.back,
      });

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture');
    }
  };

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

  const searchMyLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Required',
          'Please turn on location and allow access so we can find your current position.'
        );
        return;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert(
          'Location Services Off',
          'Turn on your device location services, then try searching your location again.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      let position: Location.LocationObject | null = null;

      try {
        position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          mayShowUserSettingsDialog: true,
        });
      } catch (currentLocationError) {
        console.warn('Current location unavailable, trying last known location:', currentLocationError);
        position = await Location.getLastKnownPositionAsync({
          maxAge: 10 * 60 * 1000,
          requiredAccuracy: 1000,
        });

        if (!position) {
          throw currentLocationError;
        }
      }

      const { latitude, longitude } = position.coords;
      setCoordinates({ latitude, longitude });

      const fallbackLocationText = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      let locationText = fallbackLocationText;

      try {
        const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
        const parts = [
          address?.name,
          address?.street,
          address?.district,
          address?.city,
          address?.region,
          address?.country,
        ].filter(Boolean);

        locationText = parts.length > 0 ? parts.join(', ') : fallbackLocationText;
      } catch (reverseGeocodeError) {
        console.warn('Could not convert coordinates to an address:', reverseGeocodeError);
      }

      setLocation(locationText);
    } catch (error) {
      console.warn('Error getting location:', error);
      Alert.alert(
        'Location Unavailable',
        'Could not get your current location. Move near a window or outdoors, make sure GPS/Wi-Fi is enabled, then try again.'
      );
    } finally {
      setIsLocating(false);
    }
  };

  const canSubmit = Boolean(image && agency && situation && injuryLevel);

  const uploadIncident = async () => {
    if (!canSubmit) {
      const missingFields = [
        !image ? 'photo' : null,
        !agency || !situation ? 'agency situation' : null,
        !injuryLevel ? 'injury level' : null,
      ].filter(Boolean);

      Alert.alert('Complete Required Fields', `Please add: ${missingFields.join(', ')}.`);
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setIsUploading(true);
    try {
      const incidentId = `${user.uid}_${Date.now()}`;

      const incidentData = {
        id: incidentId,
        userId: user.uid,
        userEmail: user.email ?? '',
        imageUrl: image,
        agency,
        situation,
        injuryLevel,
        description: `${agency} - ${situation}`,
        location: location.trim(),
        coordinates,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'incidents', incidentId), incidentData);

      Alert.alert('Success', 'Incident report submitted successfully!');
      router.back();
    } catch (error) {
      console.error('Error uploading incident:', error);
      Alert.alert('Error', 'Failed to submit incident report');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SAP THE INCIDENT</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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

        <Text style={styles.sectionLabel}>Description *</Text>
        {Object.entries(AGENCY_SITUATIONS).map(([agencyName, options]) => (
          <DropdownField
            key={agencyName}
            label={agencyName}
            value={agency === agencyName ? situation : ''}
            placeholder={`Select ${agencyName} situation...`}
            options={options}
            onSelect={(selected) => handleAgencySituationSelect(agencyName, selected)}
            isDark={isDark}
          />
        ))}

        <DropdownField
          label="Level of Injury *"
          value={injuryLevel}
          placeholder="Select injury level..."
          options={INJURY_LEVEL_OPTIONS}
          onSelect={setInjuryLevel}
          isDark={isDark}
        />

        <View style={styles.locationSection}>
          <Text style={styles.locationLabel}>Location</Text>
          <TouchableOpacity
            style={[styles.locationButton, isLocating && styles.locationButtonDisabled]}
            onPress={searchMyLocation}
            disabled={isLocating}
          >
            <Ionicons name="locate" size={18} color="#fff" />
            <Text style={styles.locationButtonText}>
              {isLocating ? 'Locating...' : 'Search My Location'}
            </Text>
          </TouchableOpacity>
          {location ? (
            <View style={styles.locationResult}>
              <Text style={styles.locationResultText}>{location}</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.uploadButton, (!canSubmit || isUploading) && styles.uploadButtonDisabled]}
          onPress={uploadIncident}
          disabled={isUploading}
        >
          <Text style={styles.uploadButtonText}>
            {isUploading ? 'Uploading...' : 'Submit Incident Report'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
