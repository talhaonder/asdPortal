import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../utils/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the ticket interfaces
interface Ticket {
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

interface ApiResponse {
  content: null;
  data: Ticket[];
  error: null;
  isSuccessful: boolean;
  message: string;
  statusCode: number;
}

// Helper to format date
const formatDate = (dateString: string) => {
  if (!dateString) return "Tarih yok";
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return "Geçersiz tarih";
  }
  
  // Simply return the formatted date without calculating relative time
  return date.toLocaleDateString('tr-TR', { 
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function HelpdeskScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [listEndReached, setListEndReached] = useState(false);

  // Fetch tickets initially
  useEffect(() => {
    fetchTickets();
  }, []);

  // Refresh tickets when returning to this screen
  useFocusEffect(
    React.useCallback(() => {
      console.log('Helpdesk screen focused, refreshing tickets...');
      handleRefresh();
      return () => {};
    }, [])
  );

  const fetchTickets = async () => {
    try {
      setLoading(true);
      console.log('Fetching tickets from API...');
      
      // The API returns an array directly, not wrapped in an ApiResponse object
      const response = await apiService.get<Ticket[]>('/HelpDesk/GetAllTalepByUserId');
      console.log('API Response received, type:', typeof response, 'isArray:', Array.isArray(response));
      
      if (Array.isArray(response) && response.length > 0) {
        console.log('Tickets received successfully:', response.length);
        setTickets(response);
      } else if (Array.isArray(response) && response.length === 0) {
        console.log('No tickets found, received empty array');
        setTickets([]);
      } else {
        console.error('API response is not an array:', response);
        setError('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setError('Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  const testEndpoint = async () => {
    try {
      console.log('Testing endpoint...');
      
      const token = await AsyncStorage.getItem('userToken');
      console.log('Token available:', !!token);
      
      // Try a simple fetch directly to test connectivity
      const testResponse = await fetch('http://192.168.0.88:5276/api/HelpDesk/GetAllTalepByUserId', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Test response status:', testResponse.status);
      
      const responseText = await testResponse.text();
      console.log('Raw response:', responseText);
      
      // Try to parse as JSON to see if it's valid
      try {
        const jsonData = JSON.parse(responseText);
        console.log('Parsed JSON response:', JSON.stringify(jsonData).substring(0, 200));
      } catch (e) {
        console.log('Not valid JSON');
      }
      
      // Retry the normal fetch
      fetchTickets();
    } catch (error) {
      console.error('Test endpoint error:', error);
    }
  };

  // Filter tickets based on active tab
  const filteredTickets = activeTab === 'all' 
    ? tickets 
    : tickets.filter(ticket => {
        if (activeTab === 'open') {
          return ticket.durumAdi === 'Açık';
        } else if (activeTab === 'in-progress') {
          // Include multiple processing statuses
          const processingStatuses = [
            'İşlemde', 
            'İşleme Alındı', 
            'Test Ediliyor', 
            'İşleniyor', 
            'Değerlendiriliyor'
          ];
          return processingStatuses.some(status => 
            ticket.durumAdi.toLowerCase().includes(status.toLowerCase())
          );
        } else {
          // For 'closed' tab, include Reddedildi status
          const closedStatuses = ['Kapatıldı', 'Çözüldü', 'Reddedildi'];
          return closedStatuses.includes(ticket.durumAdi);
        }
      });

  // Map status to badge style
  const getStatusStyle = (status: string) => {
    if (status === 'Açık') return styles.statusOpen;
    if (status === 'İşlemde') return styles.statusInProgress;
    return styles.statusClosed;
  };

  // Render a ticket item
  const renderTicketItem = ({ item }: { item: Ticket }) => {
    return (
    <TouchableOpacity 
      style={styles.ticketItem}
      onPress={() => {
        // Navigate to ticket detail page
        router.push(`/helpdesk/ticket-detail?id=${item.talepId}`);
      }}
    >
      <View style={styles.ticketHeader}>
        <Text style={styles.ticketTitle}>{item.baslik}</Text>
        <View style={[styles.statusBadge, getStatusStyle(item.durumAdi)]}>
          <Text style={styles.statusText}>{item.durumAdi}</Text>
        </View>
      </View>
      <View style={styles.ticketDetails}>
        <Text style={styles.ticketInfo}>Kategori: <Text style={styles.ticketValue}>{item.kategoriAdi}</Text></Text>
        <Text style={styles.ticketInfo}>Öncelik: <Text style={styles.ticketValue}>{item.oncelikTipi}</Text></Text>
        <Text style={styles.ticketInfo}>Talep Tipi: <Text style={styles.ticketValue}>{item.talepTip}</Text></Text>
        <Text style={styles.ticketInfo}>Oluşturulma: <Text style={styles.ticketValue}>{formatDate(item.createDate)}</Text></Text>
      </View>
    </TouchableOpacity>
  );
  };

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    console.log('Pull-to-refresh triggered');
    setRefreshing(true);
    await fetchTickets();
  };

  // Handle loading more items when scrolling to bottom
  const handleLoadMore = async () => {
    // If we've already reached the end of the list or loading is in progress, do nothing
    if (listEndReached || isLoadingMore || refreshing || loading || filteredTickets.length === 0) {
      return;
    }
    
    console.log('Loading more tickets...');
    setIsLoadingMore(true);
    
    // Mark that we've reached the end of the list to prevent further loading attempts
    setListEndReached(true);
    
    setTimeout(() => {
      setIsLoadingMore(false);
    }, 500);
  };

  // Reset list end reached state when changing tabs
  useEffect(() => {
    setListEndReached(false);
  }, [activeTab]);

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#007AFF" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Help Desk</Text>
        <TouchableOpacity 
          style={styles.newTicketButton}
          onPress={() => router.push('/helpdesk/new-ticket')}
        >
          <Ionicons name="add-circle" size={20} color="#FFFFFF" />
          <Text style={styles.newTicketText}>Yeni Talep</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Stats Container */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {tickets.filter(t => t.durumAdi === 'Açık').length}
            </Text>
            <Text style={styles.statLabel}>Açık Talepler</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {tickets.filter(t => {
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
              }).length}
            </Text>
            <Text style={styles.statLabel}>İşlemdeki</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {tickets.filter(t => {
                const closedStatuses = ['Kapatıldı', 'Çözüldü', 'Reddedildi'];
                return closedStatuses.includes(t.durumAdi);
              }).length}
            </Text>
            <Text style={styles.statLabel}>Çözüldü</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'all' && styles.activeTab]} 
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>Hepsi</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'open' && styles.activeTab]} 
            onPress={() => setActiveTab('open')}
          >
            <Text style={[styles.tabText, activeTab === 'open' && styles.activeTabText]}>Açık</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'in-progress' && styles.activeTab]} 
            onPress={() => setActiveTab('in-progress')}
          >
            <Text style={[styles.tabText, activeTab === 'in-progress' && styles.activeTabText]}>İşlemde</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'closed' && styles.activeTab]} 
            onPress={() => setActiveTab('closed')}
          >
            <Text style={[styles.tabText, activeTab === 'closed' && styles.activeTabText]}>Kapatıldı</Text>
          </TouchableOpacity>
        </View>

        {/* Tickets list */}
        {loading && !refreshing && !isLoadingMore ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loaderText}>Talepler yükleniyor...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#E53935" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchTickets}>
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.retryButton, {marginTop: 12, backgroundColor: '#4CAF50'}]} onPress={testEndpoint}>
              <Text style={styles.retryButtonText}>API Bağlantısını Test Et</Text>
            </TouchableOpacity>
          </View>
        ) : filteredTickets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text" size={48} color="#A9A9A9" />
            <Text style={styles.emptyText}>
              {activeTab === 'all' 
                ? 'Henüz talep bulunmamaktadır' 
                : 'Bu durumda talep bulunmamaktadır'}
            </Text>
            <TouchableOpacity 
              style={styles.newTicketButtonEmpty}
              onPress={() => router.push('/helpdesk/new-ticket')}
            >
              <Text style={styles.newTicketButtonEmptyText}>Yeni Talep Oluştur</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredTickets}
            renderItem={renderTicketItem}
            keyExtractor={(item) => item.talepId.toString()}
            style={styles.ticketList}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.01}
            ListFooterComponent={isLoadingMore ? (
              <View style={styles.loadMoreIndicator}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadMoreText}>Daha fazla yükleniyor...</Text>
              </View>
            ) : null}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: 40, 
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  newTicketButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  newTicketText: {
    color: '#FFFFFF',
    marginLeft: 4,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    margin: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  ticketList: {
    flex: 1,
  },
  ticketItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
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
    fontSize: 12,
    fontWeight: 'bold',
  },
  ticketDetails: {
    flexDirection: 'column',
  },
  ticketInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  ticketValue: {
    color: '#333',
    fontWeight: '500',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    color: '#E53935',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#E53935',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  newTicketButtonEmpty: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  newTicketButtonEmptyText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  loadMoreIndicator: {
    padding: 16,
    alignItems: 'center',
  },
  loadMoreText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
}); 