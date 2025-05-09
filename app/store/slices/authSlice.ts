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

export const validateToken = () => async (dispatch: any) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      return false;
    }

    const response = await fetch('http://192.168.0.88:5276/api/Auth/validate', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      // Token is valid
      return true;
    } else {
      // Token is invalid - clear it and redirect to login
      await AsyncStorage.removeItem('userToken');
      dispatch(loginFailure('Oturum süresi doldu'));
      return false;
    }
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

export const login = (username: string, password: string) => async (dispatch: any) => {
  try {
    dispatch(loginStart());
    
    console.log('Making login request to API...');
    
    // Add a lock mechanism to prevent multiple simultaneous login attempts
    let isLoginInProgress = false;
    
    try {
      // Check if a login is already in progress
      isLoginInProgress = await AsyncStorage.getItem('loginInProgress') === 'true';
      if (isLoginInProgress) {
        console.log('Another login is already in progress, waiting...');
        // Wait a bit for the other login to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if we got authenticated while waiting
        const currentToken = await AsyncStorage.getItem('userToken');
        if (currentToken) {
          console.log('User was authenticated by another process while waiting');
          dispatch(loginSuccess(currentToken));
          return true;
        }
      }
      
      // Set login in progress flag
      await AsyncStorage.setItem('loginInProgress', 'true');
      
    } catch (e) {
      console.error('Error checking login progress:', e);
    }
    
    try {
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
        
        // Make sure we clear existing token first
        await AsyncStorage.removeItem('userToken');
        console.log('Old token cleared, saving new token:', data.token.accessToken?.substring(0, 10) + '...');
        
        // Save token with await to ensure completion
        await AsyncStorage.setItem('userToken', data.token.accessToken);
        await AsyncStorage.setItem('userData', JSON.stringify(data.userData));
        
        // Verify token was saved correctly
        const savedToken = await AsyncStorage.getItem('userToken');
        if (!savedToken) {
          console.error('Failed to save token to AsyncStorage');
          dispatch(loginFailure('Token kaydetme hatası'));
          return false;
        }
        
        console.log('Token successfully saved to AsyncStorage');
        
        // Dispatch redux actions
        dispatch(loginSuccess(data.token.accessToken));
        dispatch(setUserData(data.userData));
        dispatch(saveCredentials({username, password}));
        return true;
      } else {
        console.error('Login failed:', data.message);
        dispatch(loginFailure(data.message || 'Giriş başarısız'));
        return false;
      }
    } finally {
      // Clear login in progress flag regardless of success or failure
      await AsyncStorage.removeItem('loginInProgress');
    }
  } catch (error) {
    console.error('Login error:', error);
    dispatch(loginFailure('Sunucuya bağlanılamadı'));
    
    // Clear login in progress flag
    await AsyncStorage.removeItem('loginInProgress');
    return false;
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