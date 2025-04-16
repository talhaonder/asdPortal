import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated, Easing } from 'react-native';

const { width } = Dimensions.get('window');

const SkeletonLoader = () => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  }, []);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={styles.container}>
      {[...Array(5)].map((_, index) => (
        <View key={index} style={styles.skeletonRow}>
          <View style={styles.skeletonItem}>
            <Animated.View style={[styles.shimmer, { transform: [{ translateX }] }]}>
              <LinearGradient
                colors={['rgba(0, 0, 0, 0.02)', 'rgba(0, 0, 0, 0.06)', 'rgba(0, 0, 0, 0.02)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
              />
            </Animated.View>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  skeletonRow: {
    height: 80,
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E1E9EE',
  },
  skeletonItem: {
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  shimmer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  gradient: {
    flex: 1,
  },
});

export default SkeletonLoader; 