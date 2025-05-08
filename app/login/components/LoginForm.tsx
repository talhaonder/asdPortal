import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LoginFormProps {
  username: string;
  setUsername: (username: string) => void;
  password: string;
  setPassword: (password: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  rememberMe: boolean;
  setRememberMe: (remember: boolean) => void;
  handleLogin: () => void;
  handleForgotPassword: () => void;
  isLoading: boolean;
  error: string | null;
  buttonFadeAnim: Animated.Value;
  slideAnim: Animated.Value;
}

const LoginForm: React.FC<LoginFormProps> = ({
  username,
  setUsername,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  rememberMe,
  setRememberMe,
  handleLogin,
  handleForgotPassword,
  isLoading,
  error,
  buttonFadeAnim,
  slideAnim,
}) => {
  return (
    <View style={styles.formContainer}>
      <Text style={styles.title}>Portal'a Hoş Geldiniz</Text>
      <Text style={styles.subtitle}>Hesabınıza giriş yapın</Text>

      {error ? (
        <Animated.View 
          style={[styles.errorContainer, { transform: [{ translateX: slideAnim }] }]}>
          <Ionicons name="alert-circle" size={20} color="#ff3b30" />
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      ) : null}

      <View style={styles.inputContainer}>
        <Ionicons name="person-outline" size={20} color="#777" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Kullanıcı Adı"
          placeholderTextColor="#777"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {username.length > 0 && (
          <TouchableOpacity onPress={() => setUsername('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color="#777" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="#777" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Şifre"
          placeholderTextColor="#777"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
          <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#777" />
        </TouchableOpacity>
      </View>

      <View style={styles.optionsRow}>
        <TouchableOpacity 
          style={styles.rememberMeContainer}
          onPress={() => setRememberMe(!rememberMe)}>
          <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
            {rememberMe && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          <Text style={styles.rememberMeText}>Beni Hatırla</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={styles.forgotPasswordText}>Şifremi Unuttum</Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={{ opacity: buttonFadeAnim }}>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.8}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.loginButtonText}>Giriş Yap</Text>
              <Ionicons name="arrow-forward-outline" size={20} color="#fff" style={styles.buttonIcon} />
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 12,
    padding: SCREEN_WIDTH * 0.06,
    marginVertical: SCREEN_HEIGHT * 0.03,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    marginHorizontal: SCREEN_WIDTH * 0.02,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e74f3d',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 14,
    marginBottom: 16,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    height: 64,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'center',
    includeFontPadding: true,
    paddingVertical: 12,
  },
  clearButton: {
    padding: 6,
  },
  eyeIcon: {
    padding: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e74f3d',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#e74f3d',
  },
  rememberMeText: {
    color: '#444',
    fontSize: 14,
  },
  forgotPasswordText: {
    color: '#e74f3d',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#e74f3d',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginLeft: 10,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEEEE',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
});

export default LoginForm; 