import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PinCreationModalProps {
  visible: boolean;
  onClose: () => void;
  pin: string;
  setPin: (pin: string) => void;
  confirmPin: string;
  setConfirmPin: (pin: string) => void;
  isValid: boolean;
  isLoading: boolean;
  onCreatePin: () => void;
  error?: string;
}

const PinCreationModal: React.FC<PinCreationModalProps> = ({
  visible,
  onClose,
  pin,
  setPin,
  confirmPin,
  setConfirmPin,
  isValid,
  isLoading,
  onCreatePin,
  error,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>PIN Oluştur</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#555" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.modalText}>
            Hızlı giriş için 4 haneli bir PIN kodu oluşturun.
          </Text>
          
          <View style={styles.pinInputContainer}>
            <TextInput
              style={[styles.pinInput, !isValid && styles.pinInputError]}
              placeholder="4 haneli PIN"
              placeholderTextColor="#999"
              value={pin}
              onChangeText={setPin}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
            />
          </View>
          
          <View style={styles.pinInputContainer}>
            <TextInput
              style={styles.pinInput}
              placeholder="PIN'i tekrar girin"
              placeholderTextColor="#999"
              value={confirmPin}
              onChangeText={setConfirmPin}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
            />
          </View>
          
          {!isValid && error ? (
            <Text style={styles.pinErrorText}>
              {error}
            </Text>
          ) : !isValid ? (
            <Text style={styles.pinErrorText}>
              PIN 4 haneli rakamlardan oluşmalıdır.
            </Text>
          ) : null}
          
          <TouchableOpacity
            style={styles.createButton}
            onPress={onCreatePin}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.createButtonText}>PIN Oluştur</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={onClose}>
            <Text style={styles.skipButtonText}>Şimdi Değil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e74f3d',
  },
  closeButton: {
    padding: 5,
  },
  modalText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 20,
  },
  pinInputContainer: {
    marginBottom: 16,
  },
  pinInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 15,
    fontSize: 18,
    textAlign: 'center',
  },
  pinInputError: {
    borderColor: '#ff3b30',
    backgroundColor: '#FFEEEE',
  },
  pinErrorText: {
    color: '#ff3b30',
    marginBottom: 15,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#e74f3d',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  skipButton: {
    marginTop: 10,
    padding: 10,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default PinCreationModal; 