import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import components
import Header from './components/new-ticket/Header';
import TicketTypeSelection, { TICKET_TYPES, API_TICKET_TYPES } from './components/new-ticket/TicketTypeSelection';
import { TextField, PickerField } from './components/new-ticket/FormField';
import FileUpload from './components/new-ticket/FileUpload';
import Footer from './components/new-ticket/Footer';

// Get screen width for responsive design
const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

  // Check if token exists before fetching
  const checkAuth = async () => {
    const userToken = await AsyncStorage.getItem('userToken');
    if (!userToken) {
      console.log('No auth token found, redirecting to login');
      Alert.alert(
        'Oturum Bulunamadı',
        'Lütfen giriş yapın',
        [
          {
            text: 'Giriş Yap',
            onPress: () => router.push('/login')
          }
        ],
        { cancelable: false }
      );
      return false;
    }
    setToken(userToken);
    return true;
  };

  // Fetch user token on component mount
  useEffect(() => {
    const init = async () => {
      try {
        const isAuth = await checkAuth();
        if (!isAuth) return;
      } catch (error) {
        console.error('Error fetching token:', error);
      }
    };
    init();
  }, []);

  // Fetch categories when ticket type changes
  useEffect(() => {
    if (selectedType && token) {
      // Convert ticket type to API-friendly format without Turkish characters
      let typeValue = ""; // Default to empty string if no match
      if (selectedType === TICKET_TYPES.YARDIM) typeValue = API_TICKET_TYPES.YARDIM;
      else if (selectedType === TICKET_TYPES.ONERI) typeValue = API_TICKET_TYPES.ONERI;
      else if (selectedType === TICKET_TYPES.KAIZEN) typeValue = API_TICKET_TYPES.KAIZEN;
      else if (selectedType === TICKET_TYPES.ARGE) typeValue = API_TICKET_TYPES.ARGE;
      
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

      if (response.status === 401) {
        // Handle unauthorized error
        await AsyncStorage.removeItem('userToken');
        Alert.alert(
          'Oturum Süresi Doldu',
          'Oturumunuz sona erdi. Lütfen tekrar giriş yapın.',
          [
            {
              text: 'Giriş Yap',
              onPress: () => router.push('/login')
            }
          ],
          { cancelable: false }
        );
        return;
      }

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

  // Function to handle navigation back to helpdesk screen
  const handleGoBack = () => {
    router.back();
  };

  const handleSubmit = async () => {
    if (!title || !selectedCategory || !selectedPriority || !selectedType || !description) {
      Alert.alert('Validation Error', 'Lütfen tüm alanları doldurunuz.');
      return;
    }

    // Check authentication before submitting
    const isAuth = await checkAuth();
    if (!isAuth) return;

    setIsLoading(true);

    // Convert the ticket type to API values without Turkish characters
    let apiTalepTipi = '';
    if (selectedType === TICKET_TYPES.YARDIM) apiTalepTipi = API_TICKET_TYPES.YARDIM;
    else if (selectedType === TICKET_TYPES.ONERI) apiTalepTipi = API_TICKET_TYPES.ONERI;
    else if (selectedType === TICKET_TYPES.KAIZEN) apiTalepTipi = API_TICKET_TYPES.KAIZEN;
    else if (selectedType === TICKET_TYPES.ARGE) apiTalepTipi = API_TICKET_TYPES.ARGE;

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
        
        requestBody = formData;
        console.log('Sending form data with files:', files.length, 'files');
      } else {
        // Try sending URL-encoded form data instead of JSON
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
      
      // Handle unauthorized response
      if (response.status === 401) {
        await AsyncStorage.removeItem('userToken');
        Alert.alert(
          'Oturum Süresi Doldu',
          'Oturumunuz sona erdi. Lütfen tekrar giriş yapın.',
          [
            {
              text: 'Giriş Yap',
              onPress: () => router.push('/login')
            }
          ],
          { cancelable: false }
        );
        return;
      }
      
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
          
          // Handle unauthorized response
          if (directResponse.status === 401) {
            await AsyncStorage.removeItem('userToken');
            Alert.alert(
              'Oturum Süresi Doldu',
              'Oturumunuz sona erdi. Lütfen tekrar giriş yapın.',
              [
                {
                  text: 'Giriş Yap',
                  onPress: () => router.push('/login')
                }
              ],
              { cancelable: false }
            );
            return;
          }
          
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

  // Handle adding and removing files
  const handleAddFile = (file: any) => {
    setFiles([...files, file]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  // Prepare picker items
  const categoryItems = [
    { label: "Önce talep tipi seçiniz...", value: null },
    ...categories.map(category => ({ 
      label: category.kategoriAdi, 
      value: category.id 
    }))
  ];

  const priorityItems = [
    { label: "Öncelik tipi seçiniz...", value: "" },
    { label: "İyileştirici", value: "İyileştirici" },
    { label: "Düzenleyici", value: "Düzenleyici" },
    { label: "Önleyici", value: "Önleyici" }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header onGoBack={handleGoBack} />

      <ScrollView style={styles.content}>
        {/* Ticket Type Selection */}
        <TicketTypeSelection 
          selectedType={selectedType} 
          onSelectType={setSelectedType} 
        />

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* Title Field */}
          <TextField 
            label="Başlık"
            placeholder="Talep başlığı giriniz..."
            value={title}
            onChangeText={setTitle}
            required={true}
          />

          {/* Category Field */}
          <PickerField 
            label="Kategori"
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            items={categoryItems}
            enabled={categories.length > 0}
            required={true}
          />

          {/* Priority Field */}
          <PickerField 
            label="Öncelik Tipi"
            value={selectedPriority}
            onValueChange={setSelectedPriority}
            items={priorityItems}
            required={true}
          />

          {/* Description Field */}
          <TextField 
            label="Açıklama"
            placeholder="Talep açıklamanızı buraya yazınız..."
            value={description}
            onChangeText={setDescription}
            required={true}
            multiline={true}
            numberOfLines={6}
          />

          {/* File Upload */}
          <FileUpload 
            files={files}
            onAddFile={handleAddFile}
            onRemoveFile={handleRemoveFile}
          />
        </View>
      </ScrollView>

      {/* Footer with Submit Button */}
      <Footer onSubmit={handleSubmit} isLoading={isLoading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    padding: SCREEN_WIDTH * 0.04,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: SCREEN_WIDTH * 0.04,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
}); 