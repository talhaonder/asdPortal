import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Get screen width for responsive design
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FooterProps {
  onSubmit: () => void;
  isLoading: boolean;
}

const Footer: React.FC<FooterProps> = ({ onSubmit, isLoading }) => {
  return (
    <View style={styles.footer}>
      <TouchableOpacity 
        style={styles.submitButton} 
        onPress={onSubmit}
        disabled={isLoading}
      >
        <Ionicons name="save" size={SCREEN_WIDTH * 0.05} color="#FFFFFF" />
        <Text style={styles.submitButtonText}>Kaydet</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    backgroundColor: 'white',
    padding: SCREEN_WIDTH * 0.04,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SCREEN_WIDTH * 0.03,
    borderRadius: 8,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: SCREEN_WIDTH * 0.02,
    fontSize: SCREEN_WIDTH * 0.04,
  },
});

export default Footer; 