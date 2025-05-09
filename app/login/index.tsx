import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  StatusBar,
  ScrollView,
  Keyboard,
  Modal,
  Alert,
  BackHandler,
} from 'react-native';
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { login, loginSuccess } from '../store/slices/authSlice';
import { RootState } from '../store';
import { store } from '../store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../utils/apiService';
import PinService from '../utils/pinService';

// Import components
import {
  LoginForm,
  ForgotPasswordModal,
  LogoHeader,
  AppFooter,
  PinVerificationModal,
  PinCreationModal
} from './components';

// Key for PIN enabled status in AsyncStorage
const PIN_ENABLED_KEY = 'pinLoginEnabled';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Need to move this declaration outside the component to avoid TS errors
let periodicCheckInterval: NodeJS.Timeout | null = null;

export default function Login() {
  // Add an interval ref to track and clear the PIN check interval
  const pinCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const router = useRouter();
  const dispatch = useDispatch();
  const { isLoading, error, savedCredentials } = useSelector((state: RootState) => state.auth);
  
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // PIN state
  const [pinCreationVisible, setPinCreationVisible] = useState(false);
  const [pinVerificationVisible, setPinVerificationVisible] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [verificationPin, setVerificationPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');
  const [savedUsername, setSavedUsername] = useState('');
  
  // Auto-login welcome message state
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);
  const [autoLoginUsername, setAutoLoginUsername] = useState('');
  
  // Forgot password state
  const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  
  // Keyboard state
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(1)).current;
  const inputsSlideAnim = useRef(new Animated.Value(30)).current;
  const buttonFadeAnim = useRef(new Animated.Value(0)).current;

  // Prevent going back from login page
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Prevent going back
      return true;
    });

    return () => backHandler.remove();
  }, []);

  // Track keyboard visibility
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        Animated.timing(logoScale, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  // Initial animations
  useEffect(() => {
    // Sequence of animations for a smoother experience
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(inputsSlideAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(buttonFadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        })
      ])
    ]).start();

    // Check for saved credentials
    loadSavedCredentials();
    
    // Check for PIN-based login
    checkPinProtection();
  }, []);
  
  // When component mounts - track PIN flow
  useEffect(() => {
    console.log('LOGIN COMPONENT: Component mounted, checking initial state');
    console.log('LOGIN COMPONENT: Auth state:', { 
      isAuthenticated: store.getState().auth.isAuthenticated,
      hasSavedCredentials: !!(savedCredentials?.username && savedCredentials?.password)
    });
    
    // Check for auto-login needs on mount
    checkPinProtection();
    
    // Add debug for modal visibility state
    console.log('LOGIN COMPONENT: Initial modal visibility:', {
      isPinCreationVisible: pinCreationVisible,
      isPinVerificationVisible: pinVerificationVisible
    });
    
    // When component mounts, make sure the PIN modals don't get auto-closed
    if (periodicCheckInterval) {
      clearInterval(periodicCheckInterval);
    }
    
    periodicCheckInterval = setInterval(() => {
      // Only check if already authenticated and PIN verification isn't already showing
      if (!store.getState().auth.isAuthenticated && !pinVerificationVisible && !pinCreationVisible) {
        checkPinProtection();
      }
      
      // Log visibility periodically for debugging
      console.log('LOGIN COMPONENT: Periodic auth check:', {
        isPinCreationVisible: pinCreationVisible,
        isPinVerificationVisible: pinVerificationVisible,
        isAuthenticated: store.getState().auth.isAuthenticated,
        timestamp: new Date().toISOString()
      });
    }, 2000); // Changed to 2 seconds to reduce log spam
    
    return () => {
      // Clean up the interval when the component unmounts
      clearPeriodicChecks();
    };
  }, []);

  // Check for PIN-protected login
  const checkPinProtection = async () => {
    try {
      console.log('LOGIN COMPONENT: Checking for auto-login...');
      
      // First check if user is already authenticated
      const isCurrentlyAuthenticated = store.getState().auth.isAuthenticated;
      const existingToken = await AsyncStorage.getItem('userToken');
      
      if (isCurrentlyAuthenticated && existingToken) {
        console.log('LOGIN COMPONENT: User is already authenticated with a token');
        
        // Validate the token to make sure it's still valid
        try {
          const response = await fetch('http://192.168.0.88:5276/api/Kullanici/GetUserInfo', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${existingToken}`
            }
          });
          
          if (response.ok) {
            console.log('LOGIN COMPONENT: Existing token is valid, redirecting to portal');
            // Navigate directly to portal
            PinService.navigateToPortal(router);
            return true;
          } else {
            console.error('LOGIN COMPONENT: Existing token is invalid, will try re-login');
            // Token is invalid, continue with normal auto-login flow
          }
        } catch (error) {
          console.error('LOGIN COMPONENT: Error validating existing token:', error);
          // Continue with normal auto-login flow
        }
      }
      
      // Check for Remember Me flag and stored credentials
      const isPinEnabled = await PinService.isPinLoginEnabled();
      const hasStoredCredentials = await PinService.hasStoredCredentials();
      const rememberMeValue = await AsyncStorage.getItem('rememberMe');
      const isRememberMeEnabled = rememberMeValue === 'true';
      
      console.log('LOGIN COMPONENT: Auto-login check results:', {
        isPinEnabled,
        hasStoredCredentials,
        isRememberMeEnabled,
        hasSavedCredentials: !!(savedCredentials?.username && savedCredentials?.password),
        isAuthenticated: store.getState().auth.isAuthenticated
      });
      
      // Only attempt auto-login if "Remember Me" is enabled AND we have stored credentials
      if (hasStoredCredentials && isRememberMeEnabled) {
        console.log('LOGIN COMPONENT: Remember Me is enabled and stored credentials found, attempting auto-login');
        
        // Get username for welcome message
        const username = await PinService.getSavedUsername();
        if (username) {
          setAutoLoginUsername(username);
          setIsAutoLoggingIn(true);
        }
        
        // Attempt automatic login with saved credentials
        const success = await PinService.autoLoginWithSavedCredentials(dispatch);
        
        if (success) {
          console.log('LOGIN COMPONENT: Auto-login successful, navigating to portal');
          // Keep the welcome message visible for a moment before navigating
          setTimeout(() => {
            PinService.navigateToPortal(router);
          }, 1500);
          return true;
        } else {
          console.log('LOGIN COMPONENT: Auto-login failed, fallback to manual login');
          setIsAutoLoggingIn(false);
        }
      } else {
        console.log('LOGIN COMPONENT: No Remember Me or stored credentials for auto-login');
      }
      
      return false;
    } catch (error) {
      console.error('LOGIN COMPONENT: Error checking auto-login:', error);
      setIsAutoLoggingIn(false);
      return false;
    }
  };

  const loadSavedCredentials = async () => {
    try {
      const { username: savedUsername, rememberMe: savedRememberMe } = await PinService.loadSavedCredentials();
      
      if (savedUsername && savedRememberMe) {
        setUsername(savedUsername);
        setRememberMe(true);
      }
    } catch (error) {
      console.error('Error loading saved credentials:', error);
    }
  };

  const saveCredentials = async () => {
    try {
      await PinService.saveRememberMe(username, rememberMe);
    } catch (error) {
      console.error('Error saving credentials:', error);
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      return;
    }

    Keyboard.dismiss();

    try {
      // Clear any previous PIN data when logging in normally
      console.log('Normal login, clearing previous PIN data');
      await PinService.clearPinData();

      // Save "Remember Me" preference
      await saveCredentials();

      // Attempt login
      await dispatch(login(username, password) as any);
      console.log('Login successful');

      // Store credentials for auto-login if "Beni Hatırla" is checked
      if (rememberMe) {
        console.log('Remember Me is checked, saving credentials for auto-login');
        await PinService.saveCredentials(username, password);
      } else {
        // If not checked, make sure to remove any saved credentials
        console.log('Remember Me is not checked, removing any saved credentials');
        await AsyncStorage.removeItem('storedUsername');
        await AsyncStorage.removeItem('storedPassword');
        await AsyncStorage.setItem('rememberMe', 'false');
      }

      // Success animation
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();

      // Navigate directly to portal
      console.log('Navigating to portal');
      PinService.navigateToPortal(router);
    } catch (error) {
      console.error('Login error:', error);
      // Error shake animation
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        })
      ]).start();
    }
  };
  
  const handleCreatePin = async () => {
    // Validate PIN
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setPinError('PIN must be exactly 4 digits');
      return;
    }
    
    // Validate PIN confirmation
    if (pin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }
    
    setPinLoading(true);
    
    try {
      console.log('Creating and saving PIN for quick login...');
      
      // Save PIN
      const success = await PinService.savePin(pin);
      
      if (success) {
        console.log('PIN created and enabled successfully');
        
        // Update state
        setPinCreationVisible(false);
        setPin('');
        setConfirmPin('');
        
        // Navigate to portal
        PinService.navigateToPortal(router);
      } else {
        setPinError('Failed to save PIN');
      }
    } catch (error) {
      console.error('Error saving PIN:', error);
      setPinError('An error occurred while saving PIN');
    } finally {
      setPinLoading(false);
    }
  };
  
  const handleVerifyPin = async () => {
    if (verificationPin.length !== 4) {
      setPinError('PIN must be 4 digits');
      return;
    }

    setPinLoading(true);
    setPinError('');
    
    try {
      console.log('Verifying PIN for quick login...');
      
      // Attempt login with PIN
      const success = await PinService.loginWithPin(verificationPin, dispatch);
      
      if (success) {
        console.log('PIN verified successfully, logging in');
        
        // Reset PIN states
        setPinVerificationVisible(false);
        setVerificationPin('');
        
        // Navigate to portal
        PinService.navigateToPortal(router);
      } else {
        setPinError('Invalid PIN');
      }
    } catch (error) {
      console.error('Error verifying PIN:', error);
      setPinError('An error occurred');
    } finally {
      setPinLoading(false);
    }
  };
  
  const handleCancelPin = () => {
    console.log('PIN creation cancelled by user');
    setPinCreationVisible(false);
    setPin('');
    setConfirmPin('');
    
    // Navigate to portal since login was successful but PIN creation was cancelled
    console.log('Navigating to portal after PIN creation cancelled');
    PinService.navigateToPortal(router);
  };
  
  const handleCancelPinVerification = useCallback(() => {
    // Reset PIN verification state
    setPinVerificationVisible(false);
    setVerificationPin('');
    setPinError('');
    
    // Stop the periodic checks to prevent the modal from reappearing
    clearPeriodicChecks();
    
    // Disable PIN protection temporarily for this session
    // This will prevent the modal from showing again until app restart
    AsyncStorage.setItem(PIN_ENABLED_KEY, 'false').catch(error => {
      console.error('Error disabling PIN protection:', error);
    });
  }, []);
  
  const handleForgotPassword = () => {
    setForgotPasswordVisible(true);
    setEmail('');
    setResetError('');
  };
  
  const handleResetPassword = async () => {
    if (!email || !email.includes('@')) {
      setResetError('Lütfen geçerli bir e-posta adresi giriniz.');
      return;
    }

    setIsResetLoading(true);
    setResetError('');

    try {
      await apiService.post(`/Kullanici/ForgotPassword/${encodeURIComponent(email)}`, {});
      
      setForgotPasswordVisible(false);
      Alert.alert(
        "Şifre Sıfırlama",
        "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.",
        [{ text: "Tamam" }]
      );
    } catch (error) {
      console.error('Password reset error:', error);
      setResetError('Şifre sıfırlama işlemi başarısız oldu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setIsResetLoading(false);
    }
  };

  // Add a function to clear any periodic checks
  const clearPeriodicChecks = () => {
    if (periodicCheckInterval) {
      console.log('LOGIN COMPONENT: Clearing periodic PIN checks');
      clearInterval(periodicCheckInterval);
      periodicCheckInterval = null;
    }
  };

  // Function to handle forgotten PIN
  const handleForgotPin = useCallback(() => {
    // First close the PIN verification modal
    setPinVerificationVisible(false);
    setVerificationPin('');
    setPinError('');
    
    // Confirm with the user before removing the PIN
    Alert.alert(
      "Forgot PIN",
      "Are you sure you want to clear your saved PIN? You'll need to log in with your username and password.",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            // If user cancels, we should reset the PIN verification state
            // but not remove the saved PIN
            setPinVerificationVisible(false);
          }
        },
        {
          text: "Clear PIN",
          style: "destructive",
          onPress: async () => {
            try {
              // Remove saved PIN
              await PinService.clearPinData();
              
              // Show confirmation to user
              Alert.alert(
                "PIN Cleared",
                "Your saved PIN has been removed. Please log in with your username and password.",
                [{ text: "OK" }]
              );
            } catch (error) {
              console.error('Error clearing PIN:', error);
              Alert.alert(
                "Error",
                "There was a problem clearing your PIN. Please try again.",
                [{ text: "OK" }]
              );
            }
          }
        }
      ]
    );
  }, []);

  // Add cleanup for auto-login state
  useEffect(() => {
    return () => {
      // Clear auto-login state when unmounting
      setIsAutoLoggingIn(false);
    };
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1f1f1f" />
      <LinearGradient
        colors={[ '#e74f3d','#e74f3d']}
        // colors={[ '#e74f3d','#5d1c16',  '#1f1f1f',]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          
          {/* Forgot Password Modal */}
          <ForgotPasswordModal
            visible={forgotPasswordVisible}
            onClose={() => setForgotPasswordVisible(false)}
            email={email}
            setEmail={setEmail}
            resetError={resetError}
            isLoading={isResetLoading}
            onResetPassword={handleResetPassword}
          />
          
          {/* PIN Creation Modal */}
          <PinCreationModal
            visible={pinCreationVisible}
            onClose={handleCancelPin}
            pin={pin}
            setPin={setPin}
            confirmPin={confirmPin}
            setConfirmPin={setConfirmPin}
            isValid={!pinError}
            isLoading={pinLoading}
            onCreatePin={handleCreatePin}
            error={pinError}
          />
          
          {/* PIN Verification Modal */}
          <PinVerificationModal
            visible={pinVerificationVisible}
            pin={verificationPin}
            setPin={setVerificationPin}
            onVerify={handleVerifyPin}
            onCancel={handleCancelPinVerification}
            loading={pinLoading}
            error={pinError}
            username={savedUsername}
          />
          
          {/* Auto-Login Welcome Message */}
          <Modal
            transparent={true}
            visible={isAutoLoggingIn}
            animationType="fade"
          >
            <View style={styles.autoLoginContainer}>
              <View style={styles.autoLoginCard}>
                <Animated.View style={styles.autoLoginIconContainer}>
                  <Ionicons name="person-circle" size={80} color="#e74f3d" />
                </Animated.View>
                <Text style={styles.autoLoginTitle}>Hoşgeldiniz, {autoLoginUsername}</Text>
                <Text style={styles.autoLoginText}>
                  Hesabınıza otomatik giriş yapılıyor...
                </Text>
                <ActivityIndicator size="large" color="#e74f3d" style={styles.autoLoginLoader} />
              </View>
            </View>
          </Modal>
          
          <Animated.View 
            style={[
              styles.content, 
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}>
            
            {/* Logo Header */}
            <LogoHeader logoScale={logoScale} />
            
            {/* Login Form */}
            <Animated.View style={{ transform: [{ translateY: inputsSlideAnim }] }}>
              <LoginForm
                username={username}
                setUsername={setUsername}
                password={password}
                setPassword={setPassword}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                rememberMe={rememberMe}
                setRememberMe={setRememberMe}
                handleLogin={handleLogin}
                handleForgotPassword={handleForgotPassword}
                isLoading={isLoading}
                error={error}
                buttonFadeAnim={buttonFadeAnim}
                slideAnim={slideAnim}
              />
            </Animated.View>
          </Animated.View>
          
          {/* Footer */}
          <AppFooter />
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    padding: SCREEN_WIDTH * 0.05,
    marginTop: SCREEN_HEIGHT * 0.05,
  },
  autoLoginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  autoLoginCard: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 15,
    width: SCREEN_WIDTH * 0.85,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  autoLoginIconContainer: {
    marginBottom: 20,
  },
  autoLoginTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#222',
  },
  autoLoginText: {
    fontSize: 16,
    marginBottom: 20,
    color: '#555',
    textAlign: 'center',
  },
  autoLoginLoader: {
    marginTop: 20,
  },
});
