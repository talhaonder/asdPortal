import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import * as Linking from 'expo-linking';

// Make sure base URL has proper protocol
const BASE_URL = 'http://192.168.0.88:5276/api';

// Function to handle auth errors
const handleAuthError = async () => {
  console.log('Authentication failed. Redirecting to login...');
  // Clear token
  await AsyncStorage.removeItem('userToken');
  
  // Show alert with a button to go to login
  Alert.alert(
    'Oturum Süresi Doldu',
    'Oturumunuz sona erdi. Lütfen tekrar giriş yapın.',
    [
      {
        text: 'Giriş Yap',
        onPress: () => {
          // Navigate to login page
          const loginUrl = Linking.createURL('/login');
          Linking.openURL(loginUrl);
        }
      }
    ],
    { cancelable: false }
  );
};

class ApiService {
  async getHeaders(isFormData = false) {
    const token = await AsyncStorage.getItem('userToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
    };
  }

  async get<T>(endpoint: string): Promise<T> {
    try {
      const headers = await this.getHeaders();
      console.log(`API GET Request: ${BASE_URL}${endpoint}`);
      console.log('Headers:', JSON.stringify(headers));
      
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers,
      });
      
      console.log(`API Response Status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error Response: ${errorText}`);
        
        // Handle authentication errors
        if (response.status === 401) {
          await handleAuthError();
        }
        
        throw new Error(`API Error: ${response.status}, ${errorText}`);
      }
      
      const text = await response.text();
      
      try {
        // Try to parse as JSON
        const data = JSON.parse(text) as T;
        console.log('API Response Data (preview):', 
          JSON.stringify(data).substring(0, 200) + 
          (JSON.stringify(data).length > 200 ? '...' : '')
        );
        return data;
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        console.log('Raw response text:', text);
        throw new Error('Invalid JSON response from API');
      }
    } catch (error) {
      console.error('API Service GET Error:', error);
      throw error;
    }
  }

  async post<T>(endpoint: string, body: any, isFormData = false): Promise<T> {
    try {
      const headers = await this.getHeaders(isFormData);
      
      // For FormData, don't set Content-Type header to let browser set it with boundary
      const requestHeaders = isFormData ? 
        { 'Authorization': headers.Authorization } : 
        headers;
      
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: requestHeaders,
        body: isFormData ? body : JSON.stringify(body),
      });
      
      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          await handleAuthError();
        }
        
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status}, ${errorText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Service POST Error:', error);
      throw error;
    }
  }

  async validateToken(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.error('No token found in AsyncStorage for validation');
        return false;
      }
      
      console.log(`Token validation: Using token ${token.substring(0, 10)}...`);
      
      // Instead of using a dedicated validation endpoint that doesn't exist,
      // use an existing lightweight API endpoint that requires authentication
      const response = await fetch(`${BASE_URL}/Kullanici/GetUserInfo`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log(`Token validation response: Status ${response.status}`);
      
      if (response.ok) {
        console.log('Token validation successful');
        return true;
      } else {
        const errorText = await response.text();
        console.error(`Token validation failed: Status ${response.status}, ${errorText}`);
        
        // If unauthorized, clear the token
        if (response.status === 401) {
          console.log('Clearing invalid token from storage');
          await AsyncStorage.removeItem('userToken');
        }
        
        return false;
      }
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  async getDuyurular() {
    return this.get('/Duyuru/GetAllDuyuru');
  }
}

export default new ApiService(); 