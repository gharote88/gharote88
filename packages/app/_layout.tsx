import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import Constants from 'expo-constants';
import { OneSignal } from 'react-native-onesignal';
import { onAuthStateChange, getUserProfile } from '@marathi-learning/shared';
import type { AuthUser } from '@marathi-learning/shared';
import { useOfflineCache } from './src/hooks/useOfflineCache';

SplashScreen.preventAutoHideAsync();

// Initialise OneSignal once at module load — safe to call before render
const ONESIGNAL_APP_ID: string = Constants.expoConfig?.extra?.oneSignalAppId ?? '';
if (ONESIGNAL_APP_ID && ONESIGNAL_APP_ID !== 'ONESIGNAL_APP_ID_PLACEHOLDER') {
  OneSignal.initialize(ONESIGNAL_APP_ID);
  OneSignal.Notifications.requestPermission(false);
}

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const [fontsLoaded] = useFonts({
    'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
    'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
    'OpenSans-Regular': require('./assets/fonts/OpenSans-Regular.ttf'),
    'NotoSansDevanagari-Regular': require('./assets/fonts/NotoSansDevanagari-Regular.ttf'),
  });

  useOfflineCache();

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    const unsub = onAuthStateChange(async (authUser) => {
      if (authUser) {
        const profile = await getUserProfile(authUser.id);
        setNeedsOnboarding(!profile || profile.age === 0);
      }
      setUser(authUser ?? null);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (user === undefined) return;

    const inAuth = segments[0] === 'auth';
    const inOnboarding = segments[0] === 'onboarding';

    if (!user) {
      if (!inAuth) router.replace('/auth');
    } else if (needsOnboarding) {
      if (!inOnboarding) router.replace('/onboarding');
    } else {
      if (inAuth || inOnboarding) router.replace('/dashboard');
    }
  }, [user, needsOnboarding, segments]);

  if (user === undefined || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FF6B35' }}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="lessons" />
        <Stack.Screen name="lesson/[id]" />
        <Stack.Screen name="practice" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="progress" />
        <Stack.Screen name="story" />
        <Stack.Screen name="avatar" />
        <Stack.Screen name="fun-facts" />
        <Stack.Screen name="leaderboard" />
        <Stack.Screen name="challenge" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="parent" />
        <Stack.Screen name="badges" />
        <Stack.Screen name="mini-games" />
      </Stack>
    </>
  );
}
