import React, {useCallback, useMemo, useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  Easing,
} from 'react-native';
import {
  PanGestureHandler,
  GestureHandlerRootView,
  PanGestureHandlerGestureEvent,
  PanGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import Reanimated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import ImageViewer from './ImageViewer';
import { ProductModalProps } from '../types';
import { Ionicons } from '@expo/vector-icons';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

const getHataYeriDisplay = (hataYeri: string | number) => {
  const location = Number(hataYeri);

  switch (location) {
    case 1:
    case 4:
    case 9:
    case 12:
      return 'Ön - Köşe';

    case 2:
    case 3:
    case 5:
    case 8:
    case 10:
    case 11:
      return 'Ön - Kenar';

    case 6:
    case 7:
      return 'Ön - Orta';

    case 13:
    case 16:
    case 21:
    case 24:
      return 'Arka - Köşe';

    case 14:
    case 15:
    case 17:
    case 20:
    case 22:
    case 23:
      return 'Arka - Kenar';

    case 18:
    case 19:
      return 'Arka - Orta';

    default:
      return 'Bilinmiyor';
  }
};

const ProductModal: React.FC<ProductModalProps> = ({visible, onClose, onSwipeDismiss, item, onKararUpdate, loading}) => {
  // Animation values using React Native's Animated (more stable than Reanimated for some cases)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const contentFadeAnim = useRef(new Animated.Value(0)).current; // For content fade-in separately
  
  // Local state
  const [isVisible, setIsVisible] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const scrollRef = useRef(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentKarar, setCurrentKarar] = useState(0);
  
  const BASE_URL = useMemo(() => {
    return 'http://192.168.0.88:90';
  }, []);

  // Handle animations when visibility changes
  useEffect(() => {
    if (visible && item) {
      // First make visible but with position off-screen
      setIsVisible(true);
      setCurrentKarar(item?.karar || 0);
      
      // Ensure white sections are fully rendered before animation
      slideAnim.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);
      contentFadeAnim.setValue(1); // Start content fully visible
      
      // Small delay to ensure white sections are rendered at full width
      setTimeout(() => {
        // Then animate in
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 65,
            friction: 8,
            useNativeDriver: true,
          })
        ]).start();
      }, 50);
      
      // Handle back button
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (visible) {
          closeModal();
          return true;
        }
        return false;
      });
      
      return () => backHandler.remove();
    } else {
      handleCloseAnimations();
    }
  }, [visible, item]);

  const handleCloseAnimations = () => {
    // Smoother fade out animation with sequential timing
    Animated.sequence([
      // First slightly fade the background
      Animated.timing(fadeAnim, {
        toValue: 0.7,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.sin),
      }),
      // Then slide down and fade out simultaneously
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic),
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.bezier(0.17, 0.67, 0.83, 0.67), // Custom bezier curve for natural motion
        })
      ])
    ]).start(() => {
      setIsVisible(false);
    });
  };

  const closeModal = useCallback(() => {
    handleCloseAnimations();
    // Slightly longer timeout to ensure animation completes
    setTimeout(() => {
      onClose();
    }, 350);
  }, [onClose]);

  const handlePanGesture = useCallback((event: PanGestureHandlerGestureEvent) => {
    const { translationY } = event.nativeEvent;
    if (translationY > 20) { // More responsive
      // Apply some easing to the drag for more natural feel
      const dragValue = Math.min(translationY * 0.95, SCREEN_HEIGHT);
      slideAnim.setValue(dragValue);
      
      // Gradually fade background as user drags
      const newOpacity = Math.max(0.2, 1 - (translationY / 400));
      fadeAnim.setValue(newOpacity);
      
      if (translationY > 120) { // Lower threshold for easier dismissal
        closeModal();
      }
    }
  }, [closeModal, slideAnim, fadeAnim]);

  const handlePanGestureEnd = useCallback((event: PanGestureHandlerStateChangeEvent) => {
    const { translationY, velocityY } = event.nativeEvent;
    
    // Consider both distance and velocity for a more natural feel
    if (translationY > 100 || velocityY > 500) {
      closeModal();
    } else {
      // Spring back to original position
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 8,
        useNativeDriver: true,
      }).start();
      
      // Also restore opacity
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    }
  }, [closeModal, slideAnim, fadeAnim]);

  const handleImagePress = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageViewerVisible(true);
  };

  const renderImage = useCallback(
    ({item: photo}: {item: any}) => {
      if (!photo?.fotoYolu) return null;
      const imageUrl = `${BASE_URL}${photo.fotoYolu}`;
      return (
        <TouchableOpacity 
          onPress={() => handleImagePress(imageUrl)}
          activeOpacity={0.9}
        >
          <Image
            source={{uri: imageUrl}}
            style={styles.image}
            resizeMode="cover"
          />
        </TouchableOpacity>
      );
    },
    [BASE_URL]
  );

  const handleDecision = async (karar: number) => {
    if (!item?.id) {
      console.error('No item selected');
      return;
    }
  
    setIsUpdating(true);
    try {
      const url = `${BASE_URL}/api/Product/UpdateKarar/${item.id}?karar=${karar}`;
      
      const response = await fetch(
        url,
        {
          method: 'PUT',
          headers: {
            'Accept': '*/*',
            'Content-Type': 'application/json',
          },
        }
      );
  
      const responseText = await response.text();
      
      if (response.ok) {
        setCurrentKarar(karar);
        onKararUpdate();
        setTimeout(() => {
          closeModal();
        }, 500);
      } else {
        Alert.alert('Hata', 'Karar güncellenirken bir hata oluştu');
      }
    } catch (error) {
      Alert.alert('Hata', 'Karar güncellenirken bir hata oluştu');
    } finally {
      setIsUpdating(false);
    }
  };

  const photos = useMemo(() => {
    if (!item) return [];
    if (item.abFotolars && item.abFotolars.length > 0) {
      return item.abFotolars;
    } else if (item.fotoYolu) {
      return [{
        id: 1,
        fotoYolu: item.fotoYolu
      }];
    }
    return [];
  }, [item]);

  const photoKeyExtractor = useCallback((photo: any, index: number) => 
    `modal-photo-${photo.id}-${item?.id || 'unknown'}-${index}-${photo.fotoYolu}`,
  [item?.id],);

  if (!isVisible && !visible) return null;

  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFill}>
      <Animated.View 
        style={[
          styles.backdrop, 
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          activeOpacity={1}
          onPress={closeModal}
        />
        
        <PanGestureHandler
          onGestureEvent={handlePanGesture}
          onHandlerStateChange={handlePanGestureEnd}
          activeOffsetY={10}
        >
          <Animated.View 
            style={[
              styles.modalOuterContainer, 
              { transform: [{ translateY: slideAnim }] }
            ]}
          >
            <View style={styles.modalContainer}>
              <LinearGradient
                colors={['#1981ef', '#084b8c']}
                style={styles.modalView}
                start={{x: 0, y: 0}}
                end={{x: 0, y: 1}}>
                <View style={styles.dragIndicator} />
                
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1981ef" />
                  </View>
                ) : item ? (
                  <Animated.View 
                    style={[
                      styles.contentWrapper,
                      {opacity: contentFadeAnim}
                    ]}
                  >
                    <View style={styles.modalContent}>
                      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                        <Text style={styles.siparisKodu}>{item.sipariskodu}</Text>
                        <Text style={styles.subtitle}>
                          {new Date(item.kayitTarihi || item.tarih).toLocaleString('tr-TR')}
                        </Text>
                      </View>
                      <Text style={styles.title}>
                        {item.hata} / {getHataYeriDisplay(item.hataYeri)}
                      </Text>
                      <Text style={styles.description}>{item.aciklama}</Text>
                      <Text style={styles.subtitle}>{item.musteriAd}</Text>
                      <Text style={styles.subtitle}>{item.stokTanimi}</Text>
                    </View>

                    <View style={styles.imageContainer}>
                      {photos.length > 0 ? (
                        <FlatList
                          ref={scrollRef}
                          data={photos}
                          horizontal
                          renderItem={renderImage}
                          keyExtractor={photoKeyExtractor}
                          initialNumToRender={3}
                          showsHorizontalScrollIndicator={true}
                          style={{ flexGrow: 0, width: '100%' }}
                          bounces={false}
                          pagingEnabled={true}
                        />
                      ) : (
                        <View style={styles.noImageContainer}>
                          <Ionicons name="image-outline" size={48} color="#ccc" />
                          <Text style={styles.noImagesText}>Görsel bulunamadı</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.decisionContainer}>
                      {isUpdating ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="large" color="#1981ef" />
                          <Text style={styles.loadingText}>Güncelleniyor...</Text>
                        </View>
                      ) : (
                        <>
                          <TouchableOpacity 
                            style={[styles.decisionButton, currentKarar === 1 ? styles.activeButton : styles.inactiveButton]}
                            onPress={() => handleDecision(1)}>
                            <LinearGradient
                              colors={currentKarar === 1 ? ['#4facfe', '#00f2fe'] : ['#e0e0e0', '#bdbdbd']}
                              style={styles.gradient}
                              start={{x: 0, y: 0}}
                              end={{x: 1, y: 0}}>
                              <Text style={styles.buttonText}>Onay Bekliyor</Text>
                            </LinearGradient>
                          </TouchableOpacity>

                          <TouchableOpacity 
                            style={[styles.decisionButton, currentKarar === 2 ? styles.activeButton : styles.inactiveButton]}
                            onPress={() => handleDecision(2)}>
                            <LinearGradient
                              colors={currentKarar === 2 ? ['#43e97b', '#38f9d7'] : ['#e0e0e0', '#bdbdbd']}
                              style={styles.gradient}
                              start={{x: 0, y: 0}}
                              end={{x: 1, y: 0}}>
                              <Text style={styles.buttonText}>A Sevk</Text>
                            </LinearGradient>
                          </TouchableOpacity>

                          <TouchableOpacity 
                            style={[styles.decisionButton, currentKarar === 3 ? styles.activeButton : styles.inactiveButton]}
                            onPress={() => handleDecision(3)}>
                            <LinearGradient
                              colors={currentKarar === 3 ? ['#ff758c', '#ff7eb3'] : ['#e0e0e0', '#bdbdbd']}
                              style={styles.gradient}
                              start={{x: 0, y: 0}}
                              end={{x: 1, y: 0}}>
                              <Text style={styles.buttonText}>B Sevk</Text>
                            </LinearGradient>
                          </TouchableOpacity>

                          <TouchableOpacity 
                            style={[styles.decisionButton, currentKarar === 4 ? styles.activeButton : styles.inactiveButton]}
                            onPress={() => handleDecision(4)}>
                            <LinearGradient
                              colors={currentKarar === 4 ? ['#ff9a9e', '#fad0c4'] : ['#e0e0e0', '#bdbdbd']}
                              style={styles.gradient}
                              start={{x: 0, y: 0}}
                              end={{x: 1, y: 0}}>
                              <Text style={styles.buttonText}>B Kalsın</Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </Animated.View>
                ) : null}
              </LinearGradient>
            </View>
          </Animated.View>
        </PanGestureHandler>
      </Animated.View>

      <ImageViewer
        visible={imageViewerVisible}
        imageUrl={selectedImage}
        onClose={() => setImageViewerVisible(false)}
      />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalOuterContainer: {
    width: '100%',
    height: '64%',
    overflow: 'hidden',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1981ef',
    borderTopLeftRadius: SCREEN_WIDTH * 0.08,
    borderTopRightRadius: SCREEN_WIDTH * 0.08,
    overflow: 'hidden',
  },
  modalView: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderTopLeftRadius: SCREEN_WIDTH * 0.08,
    borderTopRightRadius: SCREEN_WIDTH * 0.08,
    padding: SCREEN_WIDTH * 0.05,
    alignItems: 'center',
  },
  contentWrapper: {
    width: '100%',
    alignItems: 'center',
    minHeight: SCREEN_HEIGHT * 0.5,
  },
  modalContent: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: SCREEN_WIDTH * 0.05,
    padding: SCREEN_WIDTH * 0.03,
    marginBottom: SCREEN_HEIGHT * 0.01,
    minHeight: SCREEN_HEIGHT * 0.15,
  },
  dragIndicator: {
    width: SCREEN_WIDTH * 0.25,
    height: SCREEN_HEIGHT * 0.006,
    backgroundColor: '#fff',
    borderRadius: 3,
    marginBottom: SCREEN_HEIGHT * 0.02,
    opacity: 0.7,
  },
  subtitle: {
    fontSize: SCREEN_WIDTH * 0.032,
    color: '#555',
    marginBottom: SCREEN_HEIGHT * 0.004,
  },
  title: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '600',
    color: '#000',
  },
  siparisKodu: {
    fontSize: SCREEN_WIDTH * 0.045,
    color: '#1981ef',
    fontWeight: '800',
    marginBottom: SCREEN_HEIGHT * 0.008,
  },
  description: {
    fontSize: SCREEN_WIDTH * 0.032,
    color: '#aeaeae',
    lineHeight: SCREEN_HEIGHT * 0.022,
  },
  imageContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: SCREEN_WIDTH * 0.05,
    padding: SCREEN_WIDTH * 0.04,
    minHeight: SCREEN_HEIGHT * 0.22,
  },
  image: {
    width: SCREEN_WIDTH * 0.35,
    height: SCREEN_HEIGHT * 0.2,
    marginRight: SCREEN_WIDTH * 0.02,
    borderRadius: SCREEN_WIDTH * 0.03,
    resizeMode: 'cover',
  },
  flatListContent: {
    paddingVertical: SCREEN_HEIGHT * 0.012,
  },
  decisionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: SCREEN_HEIGHT * 0.01,
  },
  decisionButton: {
    width: '24%',
    borderRadius: SCREEN_WIDTH * 0.02,
    overflow: 'hidden',
    marginBottom: SCREEN_HEIGHT * 0.01,
  },
  gradient: {
    paddingVertical: SCREEN_HEIGHT * 0.015,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inactiveButton: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: SCREEN_WIDTH * 0.03,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: SCREEN_WIDTH * 0.02,
  },
  loadingText: {
    marginTop: 10,
    fontSize: SCREEN_WIDTH * 0.035,
    color: '#1981ef',
    fontWeight: '600',
  },
  noImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noImagesText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 8,
  },
});

export default ProductModal; 