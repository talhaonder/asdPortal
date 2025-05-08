import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';

// Get screen width for responsive design
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LoadingStateProps {
  message?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Talepler yükleniyor...' }) => {
  return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loaderText}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: SCREEN_WIDTH * 0.04,
    color: '#666',
    fontSize: SCREEN_WIDTH * 0.04,
  },
});

export default LoadingState; 