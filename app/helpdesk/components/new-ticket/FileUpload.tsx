import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

// Get screen width for responsive design
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FileUploadProps {
  files: any[];
  onAddFile: (file: any) => void;
  onRemoveFile: (index: number) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  files, 
  onAddFile, 
  onRemoveFile 
}) => {
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      
      if (result.canceled === false) {
        const newFile = result.assets[0];
        onAddFile(newFile);
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  return (
    <View style={styles.formGroup}>
      <Text style={styles.label}>Dosyalar:</Text>
      <View style={styles.fileSection}>
        {files.length > 0 ? (
          <View style={styles.fileList}>
            {files.map((file, index) => (
              <View key={index} style={styles.fileItem}>
                <Text style={styles.fileName}>{file.name}</Text>
                <TouchableOpacity 
                  onPress={() => onRemoveFile(index)}
                  style={styles.removeFileButton}
                >
                  <Ionicons name="close-circle" size={SCREEN_WIDTH * 0.05} color="red" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noFilesText}>Henüz dosya seçilmedi</Text>
        )}
        
        <TouchableOpacity 
          style={styles.fileButton} 
          onPress={handlePickDocument}
        >
          <Ionicons name="document" size={SCREEN_WIDTH * 0.05} color="#007AFF" />
          <Text style={styles.fileButtonText}>Dosya Seç</Text>
        </TouchableOpacity>
        
        <View style={styles.fileInstructions}>
          <Text style={styles.fileInstructionsTitle}>Dosya Yükleme Talimatları:</Text>
          <Text style={styles.fileInstructionsText}>- Dosya boyutu 10MB'dan küçük olmalıdır</Text>
          <Text style={styles.fileInstructionsText}>- Desteklenen dosya tipleri: PDF, DOC, DOCX, JPG, PNG</Text>
          <Text style={styles.fileInstructionsText}>- "Dosya Seç" butonuna tıklayarak cihazınızdan dosya seçebilirsiniz</Text>
          <Text style={styles.fileInstructionsText}>- Birden fazla dosya eklemek için işlemi tekrarlayabilirsiniz</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  formGroup: {
    marginBottom: SCREEN_WIDTH * 0.04,
  },
  label: {
    fontSize: SCREEN_WIDTH * 0.035,
    fontWeight: 'bold',
    marginBottom: SCREEN_WIDTH * 0.02,
    color: '#333',
  },
  fileSection: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: SCREEN_WIDTH * 0.03,
    borderStyle: 'dashed',
  },
  fileList: {
    marginBottom: SCREEN_WIDTH * 0.03,
  },
  fileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    padding: SCREEN_WIDTH * 0.02,
    marginBottom: SCREEN_WIDTH * 0.02,
  },
  fileName: {
    flex: 1,
    fontSize: SCREEN_WIDTH * 0.035,
  },
  removeFileButton: {
    padding: SCREEN_WIDTH * 0.01,
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    padding: SCREEN_WIDTH * 0.025,
    marginBottom: SCREEN_WIDTH * 0.02,
  },
  fileButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
    marginLeft: SCREEN_WIDTH * 0.02,
    fontSize: SCREEN_WIDTH * 0.035,
  },
  noFilesText: {
    textAlign: 'center',
    color: '#666',
    fontSize: SCREEN_WIDTH * 0.03,
    marginBottom: SCREEN_WIDTH * 0.02,
  },
  fileInstructions: {
    marginTop: SCREEN_WIDTH * 0.03,
    padding: SCREEN_WIDTH * 0.03,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
  },
  fileInstructionsTitle: {
    fontSize: SCREEN_WIDTH * 0.035,
    fontWeight: 'bold',
    marginBottom: SCREEN_WIDTH * 0.02,
    color: '#333',
  },
  fileInstructionsText: {
    color: '#666',
    marginBottom: SCREEN_WIDTH * 0.01,
    fontSize: SCREEN_WIDTH * 0.03,
  },
});

export default FileUpload; 