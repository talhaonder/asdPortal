import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TabType } from './TabBar';

// Get screen width for responsive design
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface EmptyStateProps {
  activeTab: TabType;
}

const EmptyState: React.FC<EmptyStateProps> = ({ activeTab }) => {
  const router = useRouter();

  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text" size={SCREEN_WIDTH * 0.12} color="#A9A9A9" />
      <Text style={styles.emptyText}>
        {activeTab === 'all' 
          ? 'Henüz talep bulunmamaktadır' 
          : 'Bu durumda talep bulunmamaktadır'}
      </Text>
      <TouchableOpacity 
        style={styles.newTicketButton}
        onPress={() => router.push('/helpdesk/new-ticket')}
      >
        <Text style={styles.newTicketButtonText}>Yeni Talep Oluştur</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SCREEN_WIDTH * 0.06,
  },
  emptyText: {
    marginTop: SCREEN_WIDTH * 0.04,
    color: '#666',
    fontSize: SCREEN_WIDTH * 0.04,
    textAlign: 'center',
    marginBottom: SCREEN_WIDTH * 0.04,
  },
  newTicketButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: SCREEN_WIDTH * 0.04,
    paddingVertical: SCREEN_WIDTH * 0.02,
    borderRadius: 20,
    marginTop: SCREEN_WIDTH * 0.02,
  },
  newTicketButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: SCREEN_WIDTH * 0.035,
  },
});

export default EmptyState; 