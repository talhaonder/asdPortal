import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../store';
import { login, loginSuccess } from '../store/slices/authSlice';

// Keys for AsyncStorage
const PIN_ENABLED_KEY = 'pinLoginEnabled';
const USER_PIN_KEY = 'userPin';
const STORED_USERNAME_KEY = 'storedUsername';
const STORED_PASSWORD_KEY = 'storedPassword';
const USER_TOKEN_KEY = 'userToken';
const REMEMBER_ME_KEY = 'rememberMe';
const SAVED_USERNAME_KEY = 'savedUsername';

/**
 * Service to handle PIN-related operations
 */
export class PinService {
  /**
   * Checks if PIN login is enabled
   */
  static async isPinLoginEnabled(): Promise<boolean> {
    try {
      const pinLoginEnabled = await AsyncStorage.getItem(PIN_ENABLED_KEY);
      const userPin = await AsyncStorage.getItem(USER_PIN_KEY);
      return pinLoginEnabled === 'true' && !!userPin;
    } catch (error) {
      console.error('Error checking PIN login status:', error);
      return false;
    }
  }

  /**
   * Saves a new PIN
   */
  static async savePin(pin: string): Promise<boolean> {
    try {
      if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        console.error('Invalid PIN format');
        return false;
      }

      await AsyncStorage.setItem(USER_PIN_KEY, pin);
      await AsyncStorage.setItem(PIN_ENABLED_KEY, 'true');
      console.log('PIN created and saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving PIN:', error);
      return false;
    }
  }

  /**
   * Verifies if the entered PIN matches the stored PIN
   */
  static async verifyPin(enteredPin: string): Promise<boolean> {
    try {
      const savedPin = await AsyncStorage.getItem(USER_PIN_KEY);
      if (!savedPin) {
        console.error('No saved PIN found');
        return false;
      }
      return savedPin === enteredPin;
    } catch (error) {
      console.error('Error verifying PIN:', error);
      return false;
    }
  }

  /**
   * Attempts to log in with saved credentials using PIN
   */
  static async loginWithPin(enteredPin: string, dispatch: any): Promise<boolean> {
    try {
      console.log('Attempting PIN login...');
      
      // First verify the PIN
      const isPinValid = await this.verifyPin(enteredPin);
      if (!isPinValid) {
        console.error('Invalid PIN entered');
        return false;
      }
      
      console.log('PIN verified successfully, retrieving credentials');
      
      // Get stored credentials
      const username = await AsyncStorage.getItem(STORED_USERNAME_KEY);
      const password = await AsyncStorage.getItem(STORED_PASSWORD_KEY);
      
      // Check if we have the stored credentials
      if (!username || !password) {
        console.error('No saved credentials found for PIN login');
        return false;
      }
      
      // Try to use saved token first if it exists
      const token = await AsyncStorage.getItem(USER_TOKEN_KEY);
      if (token) {
        console.log('Using existing token for quick login');
        // We can try to use the existing token if it's not expired
        dispatch(loginSuccess(token));
        return true;
      }
      
      console.log('No valid token found, performing full login with saved credentials');
      // Otherwise do a fresh login with the saved credentials
      await dispatch(login(username, password));
      return true;
    } catch (error) {
      console.error('Error during PIN login:', error);
      return false;
    }
  }

  /**
   * Clear PIN data when user forgets PIN
   */
  static async clearPinData(): Promise<void> {
    try {
      console.log('Clearing PIN data...');
      await AsyncStorage.removeItem(USER_PIN_KEY);
      await AsyncStorage.setItem(PIN_ENABLED_KEY, 'false');
      console.log('PIN data cleared successfully');
    } catch (error) {
      console.error('Error clearing PIN data:', error);
    }
  }

  /**
   * Save credentials for PIN login
   */
  static async saveCredentials(username: string, password: string): Promise<void> {
    try {
      console.log('Saving credentials for auto-login...');
      await AsyncStorage.setItem(STORED_USERNAME_KEY, username);
      await AsyncStorage.setItem(STORED_PASSWORD_KEY, password);
      // Also set Remember Me flag to true when saving credentials
      await AsyncStorage.setItem(REMEMBER_ME_KEY, 'true');
      // Store the same username in both places for consistency
      await AsyncStorage.setItem(SAVED_USERNAME_KEY, username);
      console.log('Credentials saved successfully');
    } catch (error) {
      console.error('Error saving credentials for auto-login:', error);
    }
  }
  
  /**
   * Check if credentials exist for PIN login
   */
  static async hasStoredCredentials(): Promise<boolean> {
    try {
      const username = await AsyncStorage.getItem(STORED_USERNAME_KEY);
      const password = await AsyncStorage.getItem(STORED_PASSWORD_KEY);
      return !!username && !!password;
    } catch (error) {
      console.error('Error checking stored credentials:', error);
      return false;
    }
  }
  
  /**
   * Get the saved username for greeting
   */
  static async getSavedUsername(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORED_USERNAME_KEY);
    } catch (error) {
      console.error('Error getting saved username:', error);
      return null;
    }
  }
  
  /**
   * Save "Remember Me" preference
   */
  static async saveRememberMe(username: string, rememberMe: boolean): Promise<void> {
    try {
      if (rememberMe) {
        await AsyncStorage.setItem(SAVED_USERNAME_KEY, username);
        await AsyncStorage.setItem(REMEMBER_ME_KEY, 'true');
      } else {
        await AsyncStorage.removeItem(SAVED_USERNAME_KEY);
        await AsyncStorage.setItem(REMEMBER_ME_KEY, 'false');
      }
    } catch (error) {
      console.error('Error saving "Remember Me" preference:', error);
    }
  }
  
  /**
   * Load saved username if "Remember Me" was checked
   */
  static async loadSavedCredentials(): Promise<{ username: string | null, rememberMe: boolean }> {
    try {
      const savedUsername = await AsyncStorage.getItem(SAVED_USERNAME_KEY);
      const savedRememberMe = await AsyncStorage.getItem(REMEMBER_ME_KEY);
      
      return {
        username: savedUsername,
        rememberMe: savedRememberMe === 'true'
      };
    } catch (error) {
      console.error('Error loading saved credentials:', error);
      return { username: null, rememberMe: false };
    }
  }
  
  /**
   * Navigate to portal with proper timing
   * This ensures the modal has time to close before navigation
   */
  static navigateToPortal(router: any): void {
    console.log('Scheduling navigation to portal...');
    setTimeout(() => {
      console.log('Now navigating to portal');
      router.replace('/portal');
    }, 500);
  }

  /**
   * Automatically log in with saved credentials without requiring PIN
   */
  static async autoLoginWithSavedCredentials(dispatch: any): Promise<boolean> {
    try {
      console.log('Attempting automatic login with saved credentials...');

      // Check if auto-login is already in progress
      const autoLoginInProgress = await AsyncStorage.getItem('autoLoginInProgress');
      if (autoLoginInProgress === 'true') {
        console.log('Another auto-login process is already running, waiting for it to complete...');
        
        // Wait for the other process to complete
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Check if authentication was successful
        const isAuthenticated = store.getState().auth.isAuthenticated;
        const token = await AsyncStorage.getItem(USER_TOKEN_KEY);
        
        if (isAuthenticated && token) {
          console.log('User is already authenticated by another login process');
          return true;
        }
      }
      
      // Set auto-login in progress flag
      await AsyncStorage.setItem('autoLoginInProgress', 'true');
      
      try {
        // Get stored credentials
        const username = await AsyncStorage.getItem(STORED_USERNAME_KEY);
        const password = await AsyncStorage.getItem(STORED_PASSWORD_KEY);
        const rememberMe = await AsyncStorage.getItem(REMEMBER_ME_KEY);

        // Check if we have the stored credentials and "Remember Me" is enabled
        if (!username || !password || rememberMe !== 'true') {
          console.error('No saved credentials found or "Remember Me" is not enabled');
          return false;
        }

        // Perform full login with saved credentials
        console.log('Performing full login with saved credentials to ensure proper initialization');
        
        // Clear any existing token first to prevent conflicts
        await AsyncStorage.removeItem(USER_TOKEN_KEY);
        
        // Do a fresh login with the saved credentials and wait for it to complete
        const loginSuccess = await dispatch(login(username, password));
        
        // Check if login was successful
        if (!loginSuccess) {
          console.error('Auto-login failed: API login returned false');
          return false;
        }
        
        // Add a small delay to ensure token is fully processed
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verify the token was saved correctly
        const savedToken = await AsyncStorage.getItem(USER_TOKEN_KEY);
        if (!savedToken) {
          console.error('Login appeared successful but no token was saved');
          return false;
        }
        
        console.log('Auto-login completed successfully and token verified');
        return true;
      } finally {
        // Clear auto-login flag regardless of success or failure
        await AsyncStorage.removeItem('autoLoginInProgress');
      }
    } catch (error) {
      console.error('Error during automatic login:', error);
      await AsyncStorage.removeItem('autoLoginInProgress');
      return false;
    }
  }
}

export default PinService; 