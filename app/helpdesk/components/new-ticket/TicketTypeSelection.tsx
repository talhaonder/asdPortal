import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Get screen width for responsive design
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Define the ticket types
export const TICKET_TYPES = {
  YARDIM: 'Yardım',
  ONERI: 'Öneri',
  KAIZEN: 'Kaizen',
  ARGE: 'Arge'
};

// Define the API ticket types (without Turkish characters)
export const API_TICKET_TYPES = {
  YARDIM: 'Yardim',
  ONERI: 'Oneri',
  KAIZEN: 'Kaizen',
  ARGE: 'Arge'
};

interface TicketTypeSelectionProps {
  selectedType: string | null;
  onSelectType: (type: string) => void;
}

const TicketTypeSelection: React.FC<TicketTypeSelectionProps> = ({ 
  selectedType, 
  onSelectType 
}) => {
  return (
    <View style={styles.typeSelectionContainer}>
      <TouchableOpacity 
        style={[
          styles.typeOption, 
          selectedType === TICKET_TYPES.YARDIM && styles.selectedTypeOption
        ]}
        onPress={() => onSelectType(TICKET_TYPES.YARDIM)}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="help-circle" size={SCREEN_WIDTH * 0.08} color="#007AFF" />
        </View>
        <Text style={styles.typeLabel}>Yardım</Text>
        <Text style={styles.typeDescription}>Sistem kullanımı ve diğer konular ile ilgili yardım</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[
          styles.typeOption, 
          selectedType === TICKET_TYPES.ONERI && styles.selectedTypeOption
        ]}
        onPress={() => onSelectType(TICKET_TYPES.ONERI)}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="bulb" size={SCREEN_WIDTH * 0.08} color="#007AFF" />
        </View>
        <Text style={styles.typeLabel}>Öneri</Text>
        <Text style={styles.typeDescription}>Sistemin ve işleyişin geliştirilmesi için öneriler</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[
          styles.typeOption, 
          selectedType === TICKET_TYPES.KAIZEN && styles.selectedTypeOption
        ]}
        onPress={() => onSelectType(TICKET_TYPES.KAIZEN)}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="sync" size={SCREEN_WIDTH * 0.08} color="#007AFF" />
        </View>
        <Text style={styles.typeLabel}>Kaizen</Text>
        <Text style={styles.typeDescription}>Sürekli iyileştirme önerileri</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[
          styles.typeOption, 
          selectedType === TICKET_TYPES.ARGE && styles.selectedTypeOption
        ]}
        onPress={() => onSelectType(TICKET_TYPES.ARGE)}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="flask" size={SCREEN_WIDTH * 0.08} color="#007AFF" />
        </View>
        <Text style={styles.typeLabel}>Arge</Text>  
        <Text style={styles.typeDescription}>Arge ile ilgili talep</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  typeSelectionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SCREEN_WIDTH * 0.05,
  },
  typeOption: {
    width: '48%', // Changed from '22%' to '48%' for better responsiveness
    backgroundColor: 'white',
    borderRadius: 8,
    padding: SCREEN_WIDTH * 0.03,
    alignItems: 'center',
    marginBottom: SCREEN_WIDTH * 0.025,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedTypeOption: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  iconContainer: {
    width: SCREEN_WIDTH * 0.12,
    height: SCREEN_WIDTH * 0.12,
    borderRadius: SCREEN_WIDTH * 0.06,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SCREEN_WIDTH * 0.02,
  },
  typeLabel: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: 'bold',
    marginBottom: SCREEN_WIDTH * 0.01,
    color: '#333',
  },
  typeDescription: {
    fontSize: SCREEN_WIDTH * 0.03,
    color: '#666',
    textAlign: 'center',
  },
});

export default TicketTypeSelection; 