import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

// Get screen width for responsive design
const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabType = 'all' | 'open' | 'in-progress' | 'closed';

interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
  return (
    <View style={styles.tabContainer}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'all' && styles.activeTab]} 
        onPress={() => onTabChange('all')}
      >
        <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>Hepsi</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'open' && styles.activeTab]} 
        onPress={() => onTabChange('open')}
      >
        <Text style={[styles.tabText, activeTab === 'open' && styles.activeTabText]}>Açık</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'in-progress' && styles.activeTab]} 
        onPress={() => onTabChange('in-progress')}
      >
        <Text style={[styles.tabText, activeTab === 'in-progress' && styles.activeTabText]}>İşlemde</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'closed' && styles.activeTab]} 
        onPress={() => onTabChange('closed')}
      >
        <Text style={[styles.tabText, activeTab === 'closed' && styles.activeTabText]}>Kapatıldı</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: SCREEN_WIDTH * 0.04,
    width: '100%',
  },
  tab: {
    flex: 1,
    paddingVertical: SCREEN_WIDTH * 0.03,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    color: '#666',
    fontSize: SCREEN_WIDTH * 0.035,
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});

export default TabBar;
export type { TabType }; 