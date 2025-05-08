import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Get screen width for responsive design
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  return (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle" size={SCREEN_WIDTH * 0.12} color="#E53935" />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>Tekrar Dene</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SCREEN_WIDTH * 0.06,
  },
  errorText: {
    marginTop: SCREEN_WIDTH * 0.04,
    color: '#E53935',
    fontSize: SCREEN_WIDTH * 0.04,
    textAlign: 'center',
    marginBottom: SCREEN_WIDTH * 0.04,
  },
  retryButton: {
    backgroundColor: '#E53935',
    paddingHorizontal: SCREEN_WIDTH * 0.04,
    paddingVertical: SCREEN_WIDTH * 0.02,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: SCREEN_WIDTH * 0.035,
  },
});

export default ErrorState; 