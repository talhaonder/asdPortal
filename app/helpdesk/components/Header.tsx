import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Get screen width for responsive design
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const Header: React.FC = () => {
  const router = useRouter();

  return (
    <>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={SCREEN_WIDTH * 0.06} color="#007AFF" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Help Desk</Text>
        <TouchableOpacity 
          style={styles.newTicketButton}
          onPress={() => router.push('/helpdesk/new-ticket')}
        >
          <Ionicons name="add-circle" size={SCREEN_WIDTH * 0.05} color="#FFFFFF" />
          <Text style={styles.newTicketText}>Yeni Talep</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  backButton: {
    width: SCREEN_WIDTH * 0.1,
    height: SCREEN_WIDTH * 0.1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SCREEN_WIDTH * 0.04,
    marginBottom: SCREEN_WIDTH * 0.02,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.04,
    marginBottom: SCREEN_WIDTH * 0.04,
  },
  headerTitle: {
    fontSize: SCREEN_WIDTH * 0.06,
    fontWeight: 'bold',
    color: '#333',
  },
  newTicketButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SCREEN_WIDTH * 0.02,
    paddingHorizontal: SCREEN_WIDTH * 0.03,
    borderRadius: 20,
  },
  newTicketText: {
    color: '#FFFFFF',
    marginLeft: 4,
    fontWeight: 'bold',
    fontSize: SCREEN_WIDTH * 0.035,
  },
});

export default Header; 