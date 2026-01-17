import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

interface LocationModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: string) => void;
}

const zamboangaCities = [
  'Zamboanga City',
  'Isabela City',
  'Lamitan City',
];

const zamboangaBarangays = [
  // Zamboanga City Barangays
  'Arena Blanco', 'Ayala', 'Baliwasan', 'Baluno', 'Barangay Zone I (Pob.)', 'Barangay Zone II (Pob.)',
  'Barangay Zone III (Pob.)', 'Barangay Zone IV (Pob.)', 'Cabatangan', 'Calarian', 'Camaro',
  'Cawit', 'Curuan', 'Divisoria', 'Dulian', 'Dulian Upper', 'Guadalupe', 'Guiwan', 'Lantawan',
  'Lapakan', 'Lapuz', 'Lubigan', 'Maasin', 'Malagutay', 'Manicahan', 'Mansaka', 'Mariki',
  'Mampang', 'Mercedes', 'Muti', 'Pangapuyan', 'Pasonanca', 'Patalon', 'Putik', 'Quiniput',
  'Recodo', 'Rio Hondo', 'Sangali', 'San Jose Gusu', 'San Roque', 'Santa Barbara', 'Santa Catalina',
  'Santa Maria', 'Santo Niño', 'Sibulao', 'Sinunuc', 'Talisayan', 'Tetuan', 'Tictabon',
  'Tigbalabag', 'Tumaga', 'Tumaga Upper', 'Tulungatung', 'Victoria', 'Vitali', 'Zamboanga',
  // Isabela City Barangays
  'Aguada', 'Balatanay', 'Baluno', 'Binuangan', 'Busay', 'Cabunbata', 'Carbon', 'Diki',
  'Dulis', 'Isabela Proper Pob', 'Kumalarang', 'Lampinigan', 'Lanu', 'Lukbuton', 'Masin',
  'Panigayan', 'Port Area', 'Seaside', 'Sumisip', 'Tabiawan', 'Tabuk', 'Tampakan',
  'Tapiantana', 'Tumahubong', 'Tumalub', 'Tumbaga',
  // Lamitan City Barangays
  'Antonio Luna', 'Ba-asa', 'Balagtasan', 'Baluno', 'Basa', 'Bato-Bato', 'Bilis', 'Buluang',
  'Calugusan', 'Campong', 'Danit', 'Kumalarang', 'Lamitan Proper', 'Loboh', 'Lo-ok', 'Malo-ong',
  'Malusu', 'Mangal', 'Mangga', 'Masil', 'Pag-Asa', 'Pangpang', 'Parang-Parang', 'Ramos',
  'Sangkapon', 'San Lorenzo', 'Santa Cruz', 'Tabi', 'Taguili', 'Tambak', 'Tapiantana',
  'Tumahubong', 'Ubit', 'Uma', 'Villaflores',
];

export default function LocationModal({ visible, onClose, onSelect }: LocationModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const styles = StyleSheet.create({
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
      maxHeight: '80%',
      padding: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
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
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      marginBottom: 10,
      marginTop: 15,
    },
    locationItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#2a2a2a' : '#f0f0f0',
    },
    locationText: {
      fontSize: 14,
      color: isDark ? '#fff' : '#000',
    },
  });

  const handleLocationSelect = (location: string) => {
    onSelect(location);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Location</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Cities</Text>
            {zamboangaCities.map((city, index) => (
              <TouchableOpacity
                key={`city-${index}`}
                style={styles.locationItem}
                onPress={() => handleLocationSelect(city)}
              >
                <Text style={styles.locationText}>{city}</Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.sectionTitle}>Barangays</Text>
            {zamboangaBarangays.map((barangay, index) => (
              <TouchableOpacity
                key={`barangay-${index}`}
                style={styles.locationItem}
                onPress={() => handleLocationSelect(barangay)}
              >
                <Text style={styles.locationText}>{barangay}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

