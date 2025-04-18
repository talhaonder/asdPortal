import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

const AppFooter: React.FC = () => {
  return (
    <View style={styles.bottomSection}>
      <Text style={styles.version}>© ASD Portal 2025 • Version 1.0.1</Text>
      <Text style={styles.supportText}>Update Date: 18.04.2025</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomSection: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 16,
  },
  version: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginBottom: 4,
  },
  supportText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
  },
});

export default AppFooter; 