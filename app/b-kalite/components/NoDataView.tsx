import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const NoDataView = () => (
  <View style={styles.noDataContainer}>
    <Text style={styles.noDataText}>Sonuç bulunamadı</Text>
  </View>
);

const styles = StyleSheet.create({
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default NoDataView; 