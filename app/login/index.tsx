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
    
    // Check for PIN verification needs on mount
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
      // Only check if PIN verification isn't already showing
      if (!pinVerificationVisible && !pinCreationVisible) {
        checkPinProtection();
      }
      
      // Log visibility periodically for debugging
      console.log('LOGIN COMPONENT: Periodic modal check:', {
        isPinCreationVisible: pinCreationVisible,
        isPinVerificationVisible: pinVerificationVisible,
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
      console.log('LOGIN COMPONENT: Checking for PIN protection...');
      
      const isPinEnabled = await PinService.isPinLoginEnabled();
      
      console.log('LOGIN COMPONENT: PIN check results:', {
        isPinEnabled,
        hasSavedCredentials: !!(savedCredentials?.username && savedCredentials?.password),
        isAuthenticated: store.getState().auth.isAuthenticated
      });
      
      if (isPinEnabled) {
        console.log('LOGIN COMPONENT: PIN protection active, showing verification modal');
        const savedUsername = await PinService.getSavedUsername();
        setSavedUsername(savedUsername || '');
        setPinVerificationVisible(true);
      } else {
        console.log('LOGIN COMPONENT: No PIN protection or missing PIN');
      }
    } catch (error) {
      console.error('LOGIN COMPONENT: Error checking PIN protection:', error);
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
      
      // Store credentials for PIN login
      if (rememberMe) {
        await PinService.saveCredentials(username, password);
        console.log('Credentials stored for PIN login');
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
      
      // Show PIN creation modal if remember me is checked
      if (rememberMe) {
        console.log('Showing PIN creation modal after successful login');
        setPinCreationVisible(true);
      } else {
        // Navigate directly to portal if remember me is not checked
        console.log('Navigating to portal (no PIN creation)');
        PinService.navigateToPortal(router);
      }
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
});
