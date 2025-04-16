import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { store } from './store';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginSuccess } from './store/slices/authSlice';
import { setUserData } from './store/slices/userSlice';
import * as Font from 'expo-font';
import { View, Text } from 'react-native';

// Load fonts function
async function loadFonts() {
  await Font.loadAsync({
    'Baloo2-Regular': require('../assets/fonts/Baloo2-Regular.ttf'),
    'Baloo2-Medium': require('../assets/fonts/Baloo2-Medium.ttf'),
    'Baloo2-SemiBold': require('../assets/fonts/Baloo2-SemiBold.ttf'),
    'Baloo2-Bold': require('../assets/fonts/Baloo2-Bold.ttf'),
    'Baloo2-ExtraBold': require('../assets/fonts/Baloo2-ExtraBold.ttf'),
  });
}

function RootLayoutNav() {
  const router = useRouter();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [isLoading, setIsLoading] = useState(true);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        // Load fonts
        await loadFonts();
        setFontsLoaded(true);
        
        // Check authentication
        const token = await AsyncStorage.getItem('userToken');
        const userData = await AsyncStorage.getItem('userData');
        
        if (token && userData) {
          store.dispatch(loginSuccess(token));
          store.dispatch(setUserData(JSON.parse(userData)));
        }
      } catch (error) {
        console.error('Error during app initialization:', error);
      } finally {
        setIsLoading(false);
      }
    };

    prepare();
  }, []);

  useEffect(() => {
    if (!isLoading && fontsLoaded) {
      if (!isAuthenticated) {
        router.replace('/login');
      } else {
        router.replace('/portal');
      }
    }
  }, [isAuthenticated, isLoading, fontsLoaded]);

  if (isLoading || !fontsLoaded) {
    return <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>Loading...</Text></View>; 
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login/index" />
      <Stack.Screen name="profile/index" />
      <Stack.Screen name="portal/index" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <RootLayoutNav />
    </Provider>
  );
}
