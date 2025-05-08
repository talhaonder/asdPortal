import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ticket } from './TicketItem';

// Get screen width for responsive design
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface StatsRowProps {
  tickets: Ticket[];
}

const StatsRow: React.FC<StatsRowProps> = ({ tickets }) => {
  const openCount = tickets.filter(t => t.durumAdi === 'Açık').length;
  
  const inProgressCount = tickets.filter(t => {
    const processingStatuses = [
      'İşlemde', 
      'İşleme Alındı', 
      'Test Ediliyor', 
      'İşleniyor', 
      'Değerlendiriliyor'
    ];
    return processingStatuses.some(status => 
      t.durumAdi.toLowerCase().includes(status.toLowerCase())
    );
  }).length;
  
  const closedCount = tickets.filter(t => {
    const closedStatuses = ['Kapatıldı', 'Çözüldü', 'Reddedildi'];
    return closedStatuses.includes(t.durumAdi);
  }).length;

  return (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{openCount}</Text>
        <Text style={styles.statLabel}>Açık Talepler</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{inProgressCount}</Text>
        <Text style={styles.statLabel}>İşlemdeki</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{closedCount}</Text>
        <Text style={styles.statLabel}>Çözüldü</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SCREEN_WIDTH * 0.05,
    width: '100%',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: SCREEN_WIDTH * 0.04,
    flex: 1,
    margin: SCREEN_WIDTH * 0.01,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  statValue: {
    fontSize: SCREEN_WIDTH * 0.06,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: SCREEN_WIDTH * 0.01,
  },
  statLabel: {
    fontSize: SCREEN_WIDTH * 0.035,
    color: '#666',
    textAlign: 'center',
  },
});

export default StatsRow; 