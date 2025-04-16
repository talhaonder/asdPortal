import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { ProductCardProps } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ProductCard: React.FC<ProductCardProps> = React.memo(({ item, onPress, getHataYeriDisplay }) => (
  <TouchableWithoutFeedback onPress={() => onPress(item)}>
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={styles.title} numberOfLines={1}>
          {item.musteriAd.length > 15 ? item.musteriAd.substring(0, 15) + '...' : item.musteriAd}
        </Text>
        <Text style={styles.description}>
          {new Date(item.tarih).toLocaleDateString('tr-TR')}
        </Text>
      </View>
      <Text style={styles.siparisKodu}>{item.sipariskodu}</Text>
      <Text style={styles.subtitle} numberOfLines={1}>{item.stokTanimi}</Text>
      <Text style={styles.description}>
        {item.hata} / {getHataYeriDisplay(item.hataYeri)}
      </Text>
    </View>
  </TouchableWithoutFeedback>
), (prevProps, nextProps) => {
  return prevProps.item.id === nextProps.item.id && 
         prevProps.item.karar === nextProps.item.karar;
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    width: '92%',
    alignSelf: 'center',
    padding: Math.min(SCREEN_WIDTH * 0.04, 12),
    marginVertical: SCREEN_HEIGHT * 0.008,
    borderRadius: Math.min(SCREEN_WIDTH * 0.02, 8),
    shadowColor: '#1981ef',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  title: {
    fontSize: Math.min(SCREEN_WIDTH * 0.045, 18),
    fontWeight: 'bold',
    color: '#000',
  },
  subtitle: {
    fontSize: Math.min(SCREEN_WIDTH * 0.035, 14),
    color: '#555',
    marginBottom: SCREEN_HEIGHT * 0.005,
  },
  siparisKodu: {
    fontSize: Math.min(SCREEN_WIDTH * 0.04, 16),
    color: '#1981ef',
    marginVertical: SCREEN_HEIGHT * 0.003,
  },
  description: {
    fontSize: Math.min(SCREEN_WIDTH * 0.03, 12),
    color: '#777',
  },
});

export default ProductCard; 