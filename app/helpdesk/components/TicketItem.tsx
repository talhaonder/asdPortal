import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';

// Get screen width for responsive design
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Define the ticket interface
export interface Ticket {
  talepId: number;
  siraNo: number;
  talepNo: string;
  talepTip: string;
  baslik: string;
  aciklama: string;
  kategoriId: number;
  kategoriAdi: string;
  oncelikTipi: string;
  durumId: number;
  durumAdi: string;
  createDate: string;
}

// Helper to format date
export const formatDate = (dateString: string) => {
  if (!dateString) return "Tarih yok";
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return "Geçersiz tarih";
  }
  
  return date.toLocaleDateString('tr-TR', { 
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Map status to badge style
const getStatusStyle = (status: string) => {
  if (status === 'Açık') return styles.statusOpen;
  if (status === 'İşlemde') return styles.statusInProgress;
  return styles.statusClosed;
};

interface TicketItemProps {
  ticket: Ticket;
}

const TicketItem: React.FC<TicketItemProps> = ({ ticket }) => {
  const router = useRouter();

  return (
    <TouchableOpacity 
      style={styles.ticketItem}
      onPress={() => {
        router.push(`/helpdesk/ticket-detail?id=${ticket.talepId}`);
      }}
    >
      <View style={styles.ticketHeader}>
        <Text style={styles.ticketTitle}>{ticket.baslik}</Text>
        <View style={[styles.statusBadge, getStatusStyle(ticket.durumAdi)]}>
          <Text style={styles.statusText}>{ticket.durumAdi}</Text>
        </View>
      </View>
      <View style={styles.ticketDetails}>
        <Text style={styles.ticketInfo}>Kategori: <Text style={styles.ticketValue}>{ticket.kategoriAdi}</Text></Text>
        <Text style={styles.ticketInfo}>Öncelik: <Text style={styles.ticketValue}>{ticket.oncelikTipi}</Text></Text>
        <Text style={styles.ticketInfo}>Talep Tipi: <Text style={styles.ticketValue}>{ticket.talepTip}</Text></Text>
        <Text style={styles.ticketInfo}>Oluşturulma: <Text style={styles.ticketValue}>{formatDate(ticket.createDate)}</Text></Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  ticketItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: SCREEN_WIDTH * 0.04,
    marginBottom: SCREEN_WIDTH * 0.03,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    width: '100%',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SCREEN_WIDTH * 0.03,
  },
  ticketTitle: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: SCREEN_WIDTH * 0.02,
    paddingVertical: SCREEN_WIDTH * 0.01,
    borderRadius: 12,
  },
  statusOpen: {
    backgroundColor: '#E3F2FD',
  },
  statusInProgress: {
    backgroundColor: '#FFF9C4',
  },
  statusClosed: {
    backgroundColor: '#E8F5E9',
  },
  statusText: {
    fontSize: SCREEN_WIDTH * 0.03,
    fontWeight: 'bold',
  },
  ticketDetails: {
    flexDirection: 'column',
  },
  ticketInfo: {
    fontSize: SCREEN_WIDTH * 0.035,
    color: '#666',
    marginBottom: 4,
  },
  ticketValue: {
    color: '#333',
    fontWeight: '500',
  },
});

export default TicketItem; 