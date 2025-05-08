import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Text, Dimensions, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import apiService from '../utils/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import components
import Header from './components/Header';
import StatsRow from './components/StatsRow';
import TabBar, { TabType } from './components/TabBar';
import TicketItem, { Ticket } from './components/TicketItem';
import EmptyState from './components/EmptyState';
import ErrorState from './components/ErrorState';
import LoadingState from './components/LoadingState';

// Get screen width for responsive design
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HelpdeskScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [listEndReached, setListEndReached] = useState(false);

  // Check if token exists before fetching
  const checkAuth = async () => {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      console.log('No auth token found, redirecting to login');
      Alert.alert(
        'Oturum Bulunamadı',
        'Lütfen giriş yapın',
        [
          {
            text: 'Giriş Yap',
            onPress: () => router.push('/login')
          }
        ],
        { cancelable: false }
      );
      return false;
    }
    return true;
  };

  // Fetch tickets initially
  useEffect(() => {
    const init = async () => {
      const isAuth = await checkAuth();
      if (isAuth) {
        fetchTickets();
      }
    };
    init();
  }, []);

  // Refresh tickets when returning to this screen
  useFocusEffect(
    React.useCallback(() => {
      console.log('Helpdesk screen focused, refreshing tickets...');
      const refresh = async () => {
        const isAuth = await checkAuth();
        if (isAuth) {
          handleRefresh();
        }
      };
      refresh();
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
        setError('Geçersiz yanıt formatı: Veri doğru biçimde alınamadı');
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      // Display more specific error message if available
      if (error instanceof Error) {
        setError(`Sunucu hatası: ${error.message}`);
      } else {
        setError('Ağ hatası: Sunucuya bağlanılamadı');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsLoadingMore(false);
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

  // Render footer for FlatList
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadMoreIndicator}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadMoreText}>Daha fazla yükleniyor...</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.content}>
        {/* Stats Container */}

        {/* Tabs */}
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tickets list */}
        {loading && !refreshing && !isLoadingMore ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} onRetry={fetchTickets} />
        ) : filteredTickets.length === 0 ? (
          <EmptyState activeTab={activeTab} />
        ) : (
          <FlatList
            data={filteredTickets}
            renderItem={({ item }) => <TicketItem ticket={item} />}
            keyExtractor={(item) => item.talepId.toString()}
            style={styles.ticketList}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.01}
            ListFooterComponent={renderFooter}
            contentContainerStyle={styles.listContent}
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
  },
  content: {
    flex: 1,
    padding: SCREEN_WIDTH * 0.04,
  },
  ticketList: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    paddingBottom: SCREEN_WIDTH * 0.04,
  },
  loadMoreIndicator: {
    padding: SCREEN_WIDTH * 0.04,
    alignItems: 'center',
  },
  loadMoreText: {
    marginTop: SCREEN_WIDTH * 0.02,
    color: '#666',
    fontSize: SCREEN_WIDTH * 0.035,
  },
}); 