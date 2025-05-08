import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Get screen width for responsive design
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HeaderProps {
  onGoBack: () => void;
}

const Header: React.FC<HeaderProps> = ({ onGoBack }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={onGoBack}
      >
        <Ionicons name="close" size={SCREEN_WIDTH * 0.06} color="#000" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Talep Detayı</Text>
      <View style={styles.spacer} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: SCREEN_WIDTH * 0.1,
    paddingBottom: SCREEN_WIDTH * 0.025,
    paddingHorizontal: SCREEN_WIDTH * 0.04,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: SCREEN_WIDTH * 0.02,
  },
  headerTitle: {
    fontSize: SCREEN_WIDTH * 0.045,
    fontWeight: 'bold',
    color: '#333',
  },
  spacer: {
    width: SCREEN_WIDTH * 0.1,
  },
});

export default Header; 