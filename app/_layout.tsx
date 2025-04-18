import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import { Provider } from 'react-redux';
import { store } from './store';
import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginSuccess } from './store/slices/authSlice';
import { setUserData } from './store/slices/userSlice';
import * as Font from 'expo-font';
import { View, Text, BackHandler, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// List of routes that don't require authentication
const publicRoutes = ['/login', '/_layout', '/index', '/'];

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

// Authentication guard component
function AuthenticationGuard({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const router = useRouter();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const currentPath = usePathname();
  const isMounted = useRef(false);

  // First mount effect
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Disable Android back button when not authenticated
  useEffect(() => {
    if (!isMounted.current) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      const isPublicRoute = publicRoutes.some(route => 
        currentPath === route || currentPath.startsWith(route + '/')
      );
      
      // If not authenticated and trying to go back from a protected route, prevent it
      if (!isAuthenticated && !isPublicRoute) {
        // Use a timeout to defer navigation
        setTimeout(() => {
          router.replace('/login');
        }, 0);
        return true; // Prevent default behavior
      }
      
      // If on login page, prevent going back
      if (currentPath === '/login') {
        return true; // Prevent default behavior
      }
      
      return false; // Allow default back behavior in other cases
    });

    return () => backHandler.remove();
  }, [isAuthenticated, currentPath, isMounted.current]);

  // Handle navigation protection - with a slight delay to ensure mounting
  useEffect(() => {
    if (!isMounted.current) return;
    
    const isPublicRoute = publicRoutes.some(route => 
      currentPath === route || currentPath.startsWith(route + '/')
    );
    
    // Use setTimeout to defer navigation until after mounting
    const navigationTimer = setTimeout(async () => {
      try {
        // Check if PIN verification is needed
        const pinLoginEnabled = await AsyncStorage.getItem('pinLoginEnabled');
        const userPin = await AsyncStorage.getItem('userPin');
        
        console.log("NAVIGATION GUARD: PIN check:", { 
          isAuthenticated, 
          currentPath,
          pinLoginEnabled,
          hasPin: !!userPin
        });
        
        if (!isAuthenticated && !isPublicRoute) {
          // Not authenticated and on protected route - go to login
          console.log("NAVIGATION GUARD: Not authenticated on protected route, redirecting to login");
          router.replace('/login');
        } 
        // REMOVE AUTOMATIC NAVIGATION TO PORTAL - let the PIN screens handle it
        // else if (isAuthenticated && currentPath === '/login') {
        //   if (pinLoginEnabled !== 'true' || !userPin) {
        //     console.log("No PIN protection, navigating to portal");
        //     router.replace('/portal');
        //   } else {
        //     console.log("PIN protection active, staying on login for verification");
        //   }
        // }
      } catch (error) {
        console.error("NAVIGATION GUARD: Error:", error);
        // Default to safe behavior on error
        if (!isAuthenticated && !isPublicRoute) {
          router.replace('/login');
        }
      }
    }, 100); // Small delay to ensure root layout is fully mounted
    
    return () => clearTimeout(navigationTimer);
  }, [isAuthenticated, segments, currentPath, isMounted.current]);

  return children;
}

function RootLayoutNav() {
  const router = useRouter();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [isLoading, setIsLoading] = useState(true);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const isMounted = useRef(false);

  // First mount effect
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

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

  // Defer initial navigation until mounting is complete
  useEffect(() => {
    if (!isLoading && fontsLoaded && isMounted.current) {
      // Use setTimeout to ensure the navigation happens after mounting
      const timer = setTimeout(() => {
        // Don't auto-navigate when authenticated - let the PIN system handle it
        if (!isAuthenticated) {
          router.replace('/login');
        }
        // We've removed auto-navigation to portal to allow PIN screens to show up
      }, 100); // Small delay to ensure mounting
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, fontsLoaded, isMounted.current]);

  if (isLoading || !fontsLoaded) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9'}}>
        <ActivityIndicator size="large" color="#e74f3d" />
        <Text style={{marginTop: 20, fontSize: 16, color: '#333'}}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <Stack 
      screenOptions={{
        headerShown: false,
        gestureEnabled: isAuthenticated, // Disable gestures when not authenticated
        animation: 'fade',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="login/index" 
        options={{
          gestureEnabled: false, // Never allow gesture navigation from login
          animation: 'fade',
        }}
      />
      <Stack.Screen name="profile/index" />
      <Stack.Screen name="portal/index" />
      <Stack.Screen name="dashboard/index" />
      <Stack.Screen name="helpdesk/index" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthenticationGuard>
          <RootLayoutNav />
        </AuthenticationGuard>
      </GestureHandlerRootView>
    </Provider>
  );
}
