import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmptyViewProps {
  message?: string;
}

const EmptyView = ({ message = 'Veri bulunamadı' }: EmptyViewProps) => {
  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default EmptyView; 