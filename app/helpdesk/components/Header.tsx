import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Get screen width for responsive design
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const Header: React.FC = () => {
  const router = useRouter();

  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={SCREEN_WIDTH * 0.06} color="#007AFF" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Help Desk</Text>
      <TouchableOpacity 
        style={styles.newTicketButton}
        onPress={() => router.push('/helpdesk/new-ticket')}
      >
        <Ionicons name="add-circle" size={SCREEN_WIDTH * 0.05} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SCREEN_WIDTH * 0.03,
    paddingHorizontal: SCREEN_WIDTH * 0.04,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: SCREEN_WIDTH * 0.02,
  },
  headerTitle: {
    fontSize: SCREEN_WIDTH * 0.05,
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