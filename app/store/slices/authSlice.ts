import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setUserData } from './userSlice';

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  savedCredentials: {
    username: string | null;
    password: string | null;
  };
}

const initialState: AuthState = {
  isAuthenticated: false,
  token: null,
  isLoading: false,
  error: null,
  savedCredentials: {
    username: null,
    password: null,
  },
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.token = action.payload;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.error = null;
      state.savedCredentials = {
        username: null,
        password: null,
      };
    },
    saveCredentials: (state, action: PayloadAction<{username: string, password: string}>) => {
      state.savedCredentials.username = action.payload.username;
      state.savedCredentials.password = action.payload.password;
    },
    clearCredentials: (state) => {
      state.savedCredentials.username = null;
      state.savedCredentials.password = null;
    },
  },
});

export const { 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  logout, 
  saveCredentials,
  clearCredentials
} = authSlice.actions;

export const login = (username: string, password: string) => async (dispatch: any) => {
  try {
    dispatch(loginStart());
    
    const response = await fetch('http://192.168.0.88:5276/api/Auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        kullaniciAdi: username,
        sifre: password,
      }),
    });

    const data = await response.json();

    if (response.ok && data.token) {
      console.log('Login successful, saving token');
      await AsyncStorage.setItem('userToken', data.token.accessToken);
      await AsyncStorage.setItem('userData', JSON.stringify(data.userData));
      
      dispatch(loginSuccess(data.token.accessToken));
      dispatch(setUserData(data.userData));
      dispatch(saveCredentials({username, password}));
    } else {
      dispatch(loginFailure(data.message || 'Giriş başarısız'));
    }
  } catch (error) {
    dispatch(loginFailure('Sunucuya bağlanılamadı'));
  }
};

export const logoutUser = () => async (dispatch: any) => {
  try {
    // Clear authentication tokens and user data
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
    
    // Clear PIN-related data
    await AsyncStorage.removeItem('pinLoginEnabled');
    await AsyncStorage.removeItem('userPin');
    
    // Clear all auto-login and remember me related data
    await AsyncStorage.removeItem('rememberMe');
    await AsyncStorage.removeItem('savedUsername');
    await AsyncStorage.removeItem('storedUsername');
    await AsyncStorage.removeItem('storedPassword');
    
    // Dispatch logout action to reset Redux state
    dispatch(logout());
    dispatch({ type: 'user/clearUserData' });
  } catch (error) {
    console.error('Logout error:', error);
  }
};

export default authSlice.reducer; 