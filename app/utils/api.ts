import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.0.88:90';

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = await AsyncStorage.getItem('userToken');
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      await AsyncStorage.removeItem('userToken');
      throw new Error('Unauthorized');
    }
    throw new Error('API call failed');
  }

  const responseText = await response.text();
  return responseText ? JSON.parse(responseText) : null;
}

const api = {
  getProducts: () => apiCall('/api/Product/Listele'),
  updateProductDecision: (id: number, karar: number) => 
    apiCall(`/api/Product/UpdateKarar/${id}?karar=${karar}`, { method: 'PUT' }),
  
  login: (kullaniciAdi: string, sifre: string) => 
    apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        kullaniciAdi,
        sifre,
        rememberMe: true
      })
    }),
};

export default api; 