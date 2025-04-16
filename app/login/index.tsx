import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../store/slices/authSlice';
import { RootState } from '../store';
import { store } from '../store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function Login() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  const authState = useSelector((state: RootState) => state.auth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      return;
    }
    try {
      
      const result = await dispatch(login(username, password) as any);
      console.log('giris basarili:', result);
      
      const latestState = store.getState().auth;
      console.log('bilgiler:', {
        isAuthenticated: latestState.isAuthenticated,
        token: latestState.token
      });
      
      const storedToken = await AsyncStorage.getItem('userToken');
      console.log('token:', storedToken);
      
      const storedUserData = await AsyncStorage.getItem('userData');
      console.log('kullanicibilgileri:', storedUserData);
      
      try {
        if (storedUserData) {
          const userData = JSON.parse(storedUserData);
          console.log('kullanicibilgiler:', userData);
        }
      } catch (parseError) {
        console.error('error parse:', parseError);
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1981ef" />
      <LinearGradient
        colors={['#1981ef', '#084b8c']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}>
        
        <Animated.View 
          style={[
            styles.content, 
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
          <View style={styles.topSection}>
            <Image
              source={require('../../assets/images/ASD-Logo-Website 221.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.welcomeText}>Hoş Geldiniz</Text>
            <Text style={styles.title}>ASD Portal</Text>
            <Text style={styles.subtitle}>Hesabınıza giriş yapın</Text>

            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#ff3b30" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Kullanıcı Adı"
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Şifre"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>Giriş Yap</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSection}>
            <Text style={styles.version}>© ASD 2024 • Version 1.0.1</Text>
          </View>
        </Animated.View>
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
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: SCREEN_WIDTH * 0.05,
  },
  topSection: {
    alignItems: 'center',
    marginTop: SCREEN_HEIGHT * 0.05,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: SCREEN_WIDTH * 0.06,
    marginVertical: SCREEN_HEIGHT * 0.04,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  logo: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_HEIGHT * 0.15,
  },
  welcomeText: {
    fontSize: SCREEN_WIDTH * 0.045,
    color: '#666',
    marginBottom: 5,
  },
  title: {
    fontSize: SCREEN_WIDTH * 0.07,
    fontWeight: 'bold',
    color: '#1981ef',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: SCREEN_WIDTH * 0.04,
    color: '#666',
    marginBottom: SCREEN_HEIGHT * 0.03,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: SCREEN_HEIGHT * 0.02,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ebebeb',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: SCREEN_WIDTH * 0.04,
    color: '#333',
  },
  eyeIcon: {
    padding: 10,
  },
  loginButton: {
    backgroundColor: '#1981ef',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: SCREEN_HEIGHT * 0.02,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: SCREEN_WIDTH * 0.045,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginLeft: 10,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEEEE',
    padding: 12,
    borderRadius: 10,
    marginBottom: SCREEN_HEIGHT * 0.02,
    borderLeftWidth: 3,
    borderLeftColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    marginLeft: 8,
    fontSize: SCREEN_WIDTH * 0.035,
    flex: 1,
  },
  bottomSection: {
    alignItems: 'center',
    marginBottom: SCREEN_HEIGHT * 0.03,
  },
  version: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: SCREEN_WIDTH * 0.035,
  },
});
