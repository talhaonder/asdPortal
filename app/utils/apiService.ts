import AsyncStorage from '@react-native-async-storage/async-storage';

// Make sure base URL has proper protocol
const BASE_URL = 'http://192.168.0.88:5276/api';

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
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Service POST Error:', error);
      throw error;
    }
  }
}

export default new ApiService(); 