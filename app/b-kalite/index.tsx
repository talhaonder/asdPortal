import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { ProductItem, TabItem, ApiResponse } from './types';
import ProductCard from './components/ProductCard';
import ProductModal from './components/ProductModal';
import AnimatedTabs from './components/AnimatedTabs';
import NoDataView from './components/NoDataView';
import SkeletonLoader from './components/SkeletonLoader';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function BKalite() {
  const router = useRouter();
  const [data, setData] = useState<ProductItem[]>([]);
  const [filteredData, setFilteredData] = useState<ProductItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showNoData, setShowNoData] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ProductItem | null>(null);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sonuc, setSonuc] = useState('tumu');
  const [modalLoading, setModalLoading] = useState(false);

  const BASE_URL = useMemo(() => 'http://192.168.0.88:90', []);
  const fetchUrl = useMemo(() => {
    const endpoint = '/api/Product/Listele';
    let url = selectedIndex === 4
      ? `${BASE_URL}${endpoint}?sonuc=0`
      : `${BASE_URL}${endpoint}?karar=${selectedIndex + 1}&sonuc=0`;

    if (sonuc !== 'tumu') {
      url = url.replace('sonuc=0', `sonuc=${sonuc}`);
    }
    
    console.log('Fetching from URL:', url);
    return url;
  }, [selectedIndex, BASE_URL, sonuc]);

  const tabsData = useMemo(() => [
    { icon: 'Loader', label: 'Onay Bekliyor' },
    { icon: 'Loader', label: 'A Sevk' },
    { icon: 'AArrowUp', label: 'B Sevk' },
    { icon: 'ShieldMinus', label: 'B Kalsın' },
  ], []);

  const handlePressItem = useCallback((item: ProductItem) => {
    // First set the selected item to make sure it's available
    setSelectedItem(item);
    
    // Set loading state
    setModalLoading(true);
    
    // Small delay to ensure the item is properly set in state
    requestAnimationFrame(() => {
      // Then show modal
      setModalVisible(true);
      
      // End loading after a short delay
      setTimeout(() => {
        setModalLoading(false);
      }, 300);
    });
  }, []);

  const handleCloseModal = useCallback(() => {
    // First hide the modal
    setModalVisible(false);
    
    // Disable loading state if it's active
    if (modalLoading) {
      setModalLoading(false);
    }
    
    // After animation completes, clear the item
    setTimeout(() => {
      setSelectedItem(null);
    }, 350); // Match the animation duration in ProductModal
  }, [modalLoading]);

  const getHataYeriDisplay = useCallback((hataYeri: string) => {
    const location = Number(hataYeri);
    switch (location) {
      case 1:
      case 4:
      case 9:
      case 12:
        return 'Ön - Köşe';
      case 2:
      case 3:
      case 5:
      case 8:
      case 10:
      case 11:
        return 'Ön - Kenar';
      case 6:
      case 7:
        return 'Ön - Orta';
      case 13:
      case 16:
      case 21:
      case 24:
        return 'Arka - Köşe';
      case 14:
      case 15:
      case 17:
      case 20:
      case 22:
      case 23:
        return 'Arka - Kenar';
      case 18:
      case 19:
        return 'Arka - Orta';
      default:
        return 'Bilinmiyor';
    }
  }, []);

  const renderItem = useCallback(({ item }: { item: ProductItem }) => (
    <ProductCard
      item={item}
      onPress={handlePressItem}
      getHataYeriDisplay={getHataYeriDisplay}
    />
  ), [handlePressItem, getHataYeriDisplay]);

  const keyExtractor = useCallback((item: ProductItem) =>
    `${item.id}-${item.sipariskodu}`, []
  );

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setShowNoData(false);
    
    try {
      console.log(`Fetching data from: ${fetchUrl}`);
      const response = await fetch(fetchUrl);
      
      if (!response.ok) {
        throw new Error(`API error with status: ${response.status}`);
      }
      
      const result = await response.json() as ApiResponse;
      console.log(`Received API response:`, result);
      
      const items = result.data || [];
      console.log(`Processed ${items.length} items`);
      
      setData(items);
      handleSort(sortOrder, items);
      setShowNoData(items.length === 0);
    } catch (error) {
      console.error('Error fetching data:', error);
      setData([]);
      setFilteredData([]);
      setShowNoData(true);
    } finally {
      setIsLoading(false);
    }
  }, [fetchUrl, sortOrder]);

  const handleTabChange = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  const handleSort = useCallback((order: 'asc' | 'desc', itemsToSort = data) => {
    setSortOrder(order);
    const sorted = [...itemsToSort].sort((a, b) => {
      const dateA = new Date(a.tarih).getTime();
      const dateB = new Date(b.tarih).getTime();
      return order === 'desc' ? dateB - dateA : dateA - dateB;
    });
    setFilteredData(sorted);
  }, [data]);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
    if (!text) {
      setFilteredData(data);
      return;
    }
    const filtered = data.filter(item =>
      item.sipariskodu?.toLowerCase().includes(text.toLowerCase()) ||
      item.description?.toLowerCase().includes(text.toLowerCase()) ||
      item.musteriAd?.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredData(filtered);
  }, [data]);

  const handleKararUpdate = useCallback(() => {
    console.log("handleKararUpdate called - refreshing data");
    setIsLoading(true);
    setTimeout(() => {
      fetchData(); 
    }, 500); 
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData, selectedIndex, sonuc]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>B Kalite</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tabs */}
      <View style={styles.header}>
        <AnimatedTabs
          data={tabsData}
          onChange={handleTabChange}
          selectedIndex={selectedIndex}
        />
      </View>

      {headerVisible && (
        <View style={styles.headerSecondBar}>
          <TouchableOpacity style={styles.sortButton} onPress={() => handleSort('desc')}>
            <Ionicons name="arrow-down" size={20} color={sortOrder === 'desc' ? "#1981ef" : "#777"} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sortButton} onPress={() => handleSort('asc')}>
            <Ionicons name="arrow-up" size={20} color={sortOrder === 'asc' ? "#1981ef" : "#777"} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#777" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Kod veya açıklama ara..."
          value={searchText}
          onChangeText={handleSearch}
        />
        {searchText !== '' && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={20} color="#777" />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <SkeletonLoader />
      ) : showNoData ? (
        <NoDataView />
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <ProductModal
        visible={modalVisible && selectedItem !== null}
        onClose={handleCloseModal}
        onSwipeDismiss={handleCloseModal}
        item={selectedItem}
        onKararUpdate={handleKararUpdate}
        loading={modalLoading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 40, 
  },
  header: {
    padding: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    margin: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
  },
  headerSecondBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sortButton: {
    padding: 8,
    marginLeft: 8,
  },
  listContainer: {
    paddingBottom: 20,
  },
}); 