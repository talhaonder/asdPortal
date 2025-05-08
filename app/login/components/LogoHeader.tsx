import React from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LogoHeaderProps {
  logoScale: Animated.Value;
}

const LogoHeader: React.FC<LogoHeaderProps> = ({ logoScale }) => {
  return (
    <Animated.View 
      style={[
        styles.topSection,
        { transform: [{ scale: logoScale }] }
      ]}>
      <Image
        source={require('../../../assets/images/asdLogo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  topSection: {
    alignItems: 'center',
    marginTop: SCREEN_HEIGHT * 0.05,
    marginBottom: SCREEN_HEIGHT * 0.02,
  },
  logo: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_HEIGHT * 0.15,
  },
});

export default LogoHeader; 