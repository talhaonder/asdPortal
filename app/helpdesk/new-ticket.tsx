import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { Picker } from '@react-native-picker/picker';

// Define the ticket types
const TICKET_TYPES = {
  YARDIM: 'Yardım',
  ONERI: 'Öneri',
  KAIZEN: 'Kaizen'
};

// Define the API ticket types (without Turkish characters)
const API_TICKET_TYPES = {
  YARDIM: 'Yardim',
  ONERI: 'Oneri',
  KAIZEN: 'Kaizen'
};

// Define interfaces
interface Category {
  id: number;
  name: string;
  kategoriAdi: string;
}

interface TicketData {
  Id: number;
  Baslik: string;
  Aciklama: string;
  KategoriId: number;
  OncelikTipi: string;
  TalepTipi: string;
  Files?: File[];
}

export default function NewTicketScreen() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user token on component mount
  useEffect(() => {
    const getToken = async () => {
      try {
        const userToken = await AsyncStorage.getItem('userToken');
        setToken(userToken);
      } catch (error) {
        console.error('Error fetching token:', error);
      }
    };
    getToken();
  }, []);

  // Fetch categories when ticket type changes
  useEffect(() => {
    if (selectedType && token) {
      // Convert ticket type to API-friendly format without Turkish characters
      let typeValue = ""; // Default to empty string if no match
      if (selectedType === TICKET_TYPES.YARDIM) typeValue = API_TICKET_TYPES.YARDIM;
      else if (selectedType === TICKET_TYPES.ONERI) typeValue = API_TICKET_TYPES.ONERI;
      else if (selectedType === TICKET_TYPES.KAIZEN) typeValue = API_TICKET_TYPES.KAIZEN;
      
      fetchCategories(typeValue);
    }
  }, [selectedType, token]);

  const fetchCategories = async (type: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://192.168.0.88:5276/api/HelpDesk/GetAllKategorilerByTur/${type}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        Alert.alert('Error', 'Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Network error while fetching categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      
      if (result.canceled === false) {
        const newFile = result.assets[0];
        console.log('Selected file:', newFile);
        setFiles([...files, newFile]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  // Function to handle navigation back to helpdesk screen
  const handleGoBack = () => {
    // Simply go back to the previous screen
    
    router.back();
  };

  const handleSubmit = async () => {
    if (!title || !selectedCategory || !selectedPriority || !selectedType || !description) {
      Alert.alert('Validation Error', 'Lütfen tüm alanları doldurunuz.');
      return;
    }

    setIsLoading(true);

    const ticketData: TicketData = {
      Id: 0, // New ticket
      Baslik: title,
      Aciklama: description,
      KategoriId: selectedCategory,
      OncelikTipi: selectedPriority,
      TalepTipi: selectedType,
    };

    console.log('Sending ticket data:', JSON.stringify(ticketData));

    // Convert the ticket type to API values without Turkish characters
    let apiTalepTipi = '';
    if (selectedType === TICKET_TYPES.YARDIM) apiTalepTipi = API_TICKET_TYPES.YARDIM;
    else if (selectedType === TICKET_TYPES.ONERI) apiTalepTipi = API_TICKET_TYPES.ONERI;
    else if (selectedType === TICKET_TYPES.KAIZEN) apiTalepTipi = API_TICKET_TYPES.KAIZEN;

    // We'll use the original parameter case from the backend
    const serverTicketData = {
      Id: 0,
      Baslik: title,
      Aciklama: description,
      KategoriId: selectedCategory,
      OncelikTipi: selectedPriority,
      TalepTipi: apiTalepTipi, // Use API-friendly value
      DurumId: 1
    };

    console.log('Formatted for server:', JSON.stringify(serverTicketData));

    try {
      // If there are files, prepare form data
      let requestBody: any;
      if (files.length > 0) {
        const formData = new FormData();
        
        // Serialize the ticket data as JSON and add it as a string parameter named "talepModel"
        Object.entries(serverTicketData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, value.toString());
          }
        });
        
        // Add files with the correct parameter name "Dosyalar" to match the web app
        files.forEach((file, index) => {
          // Create proper file object for FormData
          const fileToUpload = {
            uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
            name: file.name || `file${index}.${file.mimeType.split('/')[1]}`,
            type: file.mimeType,
          };
          
          console.log(`Adding file ${index}:`, fileToUpload);
          // The server expects the parameter to be named "Dosyalar" to match web app
          formData.append('Dosyalar', fileToUpload as any);
        });
        
        // Log the full FormData for debugging
        console.log('FormData entries:');
        for (const pair of (formData as any)._parts) {
          console.log(pair[0], pair[1]);
        }
        
        requestBody = formData;
        console.log('Sending form data with files:', files.length, 'files');
      } else {
        // Try sending URL-encoded form data instead of JSON
        // This might help with how the backend deserializes the data
        const params = new URLSearchParams();
        Object.entries(serverTicketData).forEach(([key, value]) => {
          params.append(key, value?.toString() || '');
        });
        
        requestBody = params.toString();
        console.log('Sending as URL-encoded form data:', requestBody);
      }

      console.log('API URL:', 'http://192.168.0.88:5276/api/HelpDesk/TalepKaydet');
      
      const contentType = files.length > 0 ? 
        'multipart/form-data' : 
        'application/x-www-form-urlencoded';
      
      console.log('Content-Type:', contentType);

      const response = await fetch(
        'http://192.168.0.88:5276/api/HelpDesk/TalepKaydet',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            // Don't set Content-Type for multipart/form-data, let the browser set it with boundary
            ...(files.length === 0 && { 'Content-Type': contentType })
          },
          body: requestBody,
        }
      );

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('Success response:', responseData);
        
        if (responseData.isSuccessful) {
          console.log('Ticket saved successfully with ID:', responseData.data?.id || 'unknown');
          Alert.alert('Success', 'Talep başarıyla kaydedildi', [
            { text: 'OK', onPress: handleGoBack }
          ]);
        } else {
          // Try alternative approach - Direct controller method name approach
          console.log('First approach failed, trying direct endpoint...');
          
          let directEndpoint = 'http://192.168.0.88:5276/api/HelpDesk/CreateTalep';
          let directRequestBody: any = JSON.stringify(serverTicketData);
          
          // If we have files, use a specific file upload endpoint
          if (files.length > 0) {
            directEndpoint = 'http://192.168.0.88:5276/api/HelpDesk/UploadFilesWithTicket';
            console.log('Using file upload endpoint:', directEndpoint);
            
            // Recreate FormData for the direct approach
            const directFormData = new FormData();
            
            // Add all fields individually to match web app
            Object.entries(serverTicketData).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                directFormData.append(key, value.toString());
              }
            });
            
            files.forEach((file, index) => {
              const fileToUpload = {
                uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
                name: file.name || `file${index}.${file.mimeType.split('/')[1]}`,
                type: file.mimeType,
              };
              directFormData.append('Dosyalar', fileToUpload as any);
            });
            
            directRequestBody = directFormData;
          }
          
          const directResponse = await fetch(
            directEndpoint,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                ...(files.length === 0 && { 'Content-Type': 'application/json' })
              },
              body: directRequestBody,
            }
          );
          
          console.log('Direct endpoint response status:', directResponse.status);
          
          if (directResponse.ok) {
            const directResponseData = await directResponse.json();
            console.log('Direct endpoint response:', directResponseData);
            
            if (directResponseData.isSuccessful) {
              Alert.alert('Success', 'Talep başarıyla kaydedildi', [
                { text: 'OK', onPress: handleGoBack }
              ]);
              return;
            } else {
              console.error('Direct endpoint operation failed:', directResponseData.message);
            }
          }
          
          // If we get here, both approaches failed
          if (!response.ok) {
            const errorText = await response.text();
            Alert.alert('Error', `Failed to save ticket: ${errorText}`);
          } else {
            Alert.alert('Error', `Failed to save ticket: ${responseData.message}`);
          }
        }
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        Alert.alert('Error', `Failed to save ticket: ${errorText}`);
      }
    } catch (error) {
      console.error('Error saving ticket:', error);
      Alert.alert('Error', 'Network error while saving ticket');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleGoBack}
        >
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Talep Detayı</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* Ticket Type Selection */}
        <View style={styles.typeSelectionContainer}>
          <TouchableOpacity 
            style={[
              styles.typeOption, 
              selectedType === TICKET_TYPES.YARDIM && styles.selectedTypeOption
            ]}
            onPress={() => setSelectedType(TICKET_TYPES.YARDIM)}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="help-circle" size={32} color="#007AFF" />
            </View>
            <Text style={styles.typeLabel}>Yardım</Text>
            <Text style={styles.typeDescription}>Sistem kullanımı ve diğer konular ile ilgili yardım</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.typeOption, 
              selectedType === TICKET_TYPES.ONERI && styles.selectedTypeOption
            ]}
            onPress={() => setSelectedType(TICKET_TYPES.ONERI)}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="bulb" size={32} color="#007AFF" />
            </View>
            <Text style={styles.typeLabel}>Öneri</Text>
            <Text style={styles.typeDescription}>Sistemin ve işleyişin geliştirilmesi için öneriler</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.typeOption, 
              selectedType === TICKET_TYPES.KAIZEN && styles.selectedTypeOption
            ]}
            onPress={() => setSelectedType(TICKET_TYPES.KAIZEN)}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="sync" size={32} color="#007AFF" />
            </View>
            <Text style={styles.typeLabel}>Kaizen</Text>
            <Text style={styles.typeDescription}>Sürekli iyileştirme önerileri</Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Başlık: <Text style={styles.required}>*</Text></Text>
            <TextInput 
              style={styles.input} 
              placeholder="Talep başlığı giriniz..."
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Kategori: <Text style={styles.required}>*</Text></Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedCategory}
                onValueChange={(itemValue) => setSelectedCategory(itemValue)}
                style={styles.picker}
                enabled={categories.length > 0}
              >
                <Picker.Item label="Önce talep tipi seçiniz..." value={null} />
                {categories.map((category) => (
                  <Picker.Item key={category.id} label={category.kategoriAdi} value={category.id} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Öncelik Tipi: <Text style={styles.required}>*</Text></Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedPriority}
                onValueChange={(itemValue) => setSelectedPriority(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Öncelik tipi seçiniz..." value="" />
                <Picker.Item label="İyileştirici" value="İyileştirici" />
                <Picker.Item label="Düzenleyici" value="Düzenleyici" />
                <Picker.Item label="Önleyici" value="Önleyici" />
              </Picker>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Açıklama: <Text style={styles.required}>*</Text></Text>
            <TextInput 
              style={styles.textArea} 
              placeholder="Talep açıklamanızı buraya yazınız..."
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Dosyalar:</Text>
            <View style={styles.fileSection}>
              {files.length > 0 ? (
                <View style={styles.fileList}>
                  {files.map((file, index) => (
                    <View key={index} style={styles.fileItem}>
                      <Text style={styles.fileName}>{file.name}</Text>
                      <TouchableOpacity 
                        onPress={() => setFiles(files.filter((_, i) => i !== index))}
                        style={styles.removeFileButton}
                      >
                        <Ionicons name="close-circle" size={20} color="red" />
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
                <Ionicons name="document" size={20} color="#007AFF" />
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
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Ionicons name="save" size={20} color="#FFFFFF" />
          <Text style={styles.submitButtonText}>Kaydet</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: 40,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  spacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  typeSelectionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  typeOption: {
    width: '30%',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedTypeOption: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  typeDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  required: {
    color: 'red',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    minHeight: 120,
  },
  fileSection: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    borderStyle: 'dashed',
  },
  fileList: {
    marginBottom: 12,
  },
  fileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
  },
  removeFileButton: {
    padding: 4,
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    padding: 10,
    marginBottom: 8,
  },
  fileButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  noFilesText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
  },
  fileInstructions: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
  },
  fileInstructionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  fileInstructionsText: {
    color: '#666',
    marginBottom: 4,
  },
  footer: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
}); 