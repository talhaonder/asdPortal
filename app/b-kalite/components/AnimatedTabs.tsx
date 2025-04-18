import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { TabItem } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AnimatedTabsProps {
  data: TabItem[];
  onChange: (index: number) => void;
  selectedIndex: number;
}

const AnimatedTabs: React.FC<AnimatedTabsProps> = ({ data, onChange, selectedIndex }) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const itemsRef = useRef<any[]>([]);
  const [containerWidth, setContainerWidth] = useState(0);
  const indicatorPosition = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);

  const updateIndicator = useCallback((index: number) => {
    const item = itemsRef.current[index];
    if (item) {
      item.measure((_x: number, _y: number, width: number, _height: number, pageX: number) => {
        const newPosition = pageX - (SCREEN_WIDTH - containerWidth) / 2;
        indicatorPosition.value = withTiming(newPosition, { duration: 300 });
        indicatorWidth.value = withTiming(width, { duration: 300 });
      });
    }
  }, [containerWidth, indicatorPosition, indicatorWidth]);

  const handleTabPress = useCallback((index: number) => {
    onChange(index);
    updateIndicator(index);
    
    // Scroll to make selected tab visible
    if (scrollViewRef.current) {
      const item = itemsRef.current[index];
      if (item) {
        item.measure((_x: number, _y: number, width: number, _height: number, pageX: number) => {
          const scrollX = pageX - SCREEN_WIDTH / 2 + width / 2;
          scrollViewRef.current?.scrollTo({ x: scrollX, animated: true });
        });
      }
    }
  }, [onChange, updateIndicator]);

  React.useEffect(() => {
    updateIndicator(selectedIndex);
  }, [selectedIndex, updateIndicator]);

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: indicatorPosition.value }],
      width: indicatorWidth.value,
    };
  });

  return (
    <View
      style={styles.container}
    >
      <View
        style={styles.scrollContent}
      >
        {data.map((item, index) => (
          <TouchableOpacity
            key={`tab-${index}`}
            ref={(el) => (itemsRef.current[index] = el)}
            style={[
              styles.tabItem,
              selectedIndex === index && styles.activeTabItem,
            ]}
            onPress={() => handleTabPress(index)}
          >
            <Text
              style={[
                styles.tabText,
                selectedIndex === index && styles.activeTabText,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  scrollContent: {
    justifyContent: "space-between",
    flexDirection: "row"
  },
  tabItem: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginHorizontal: SCREEN_WIDTH * 0.01, // Responsive margin based on screen width
    borderRadius: 20,
  },
  activeTabItem: {
  },
  tabText: {
    fontSize: 14,
    color: '#777',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#1981ef',
    fontWeight: 'bold',
  },
});

export default React.memo(AnimatedTabs); 