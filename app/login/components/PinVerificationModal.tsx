import React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export interface PinVerificationModalProps {
  visible: boolean;
  pin: string;
  setPin: (pin: string) => void;
  onVerify: () => void;
  onClose?: () => void;
  onCancel: () => void;
  onForgotPin?: () => void;
  loading: boolean;
  error: string;
  username?: string;
}

const PinVerificationModal: React.FC<PinVerificationModalProps> = ({
  visible,
  pin,
  setPin,
  onVerify,
  onCancel,
  onForgotPin,
  loading,
  error,
  username
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
            <Ionicons name="close" size={24} color="#e74f3d" />
          </TouchableOpacity>
          
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Quick Login</Text>
            {username ? (
              <Text style={styles.greeting}>Welcome back, {username}!</Text>
            ) : (
              <Text style={styles.greeting}>Welcome back!</Text>
            )}
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.pinLabel}>Enter your 4-digit PIN</Text>
            <TextInput
              style={styles.pinInput}
              value={pin}
              onChangeText={setPin}
              placeholder="****"
              secureTextEntry
              keyboardType="numeric"
              maxLength={4}
              autoFocus
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.verifyButton, pin.length !== 4 && styles.disabledButton]}
              onPress={onVerify}
              disabled={pin.length !== 4 || loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Normal Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    width: width * 0.9,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    position: 'relative'
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74f3d',
    marginBottom: 8
  },
  greeting: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center'
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24
  },
  pinLabel: {
    fontSize: 14,
    color: '#555555',
    marginBottom: 8,
    textAlign: 'center'
  },
  pinInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 10,
    height: 64,
    includeFontPadding: true,
    paddingVertical: 12,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center'
  },
  verifyButton: {
    width: '100%',
    backgroundColor: '#e74f3d',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12
  },
  disabledButton: {
    backgroundColor: '#e74f3d80'
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  cancelButton: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16
  },
  cancelButtonText: {
    color: '#333333',
    fontSize: 16
  },
  errorText: {
    color: '#e74f3d',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center'
  }
});

export default PinVerificationModal; 