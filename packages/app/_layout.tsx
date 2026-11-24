import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChange, getUserProfile } from '@marathi-learning/shared';
import type { AuthUser } from '@marathi-learning/shared';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

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

  if (user === undefined) {
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
      </Stack>
    </>
  );
}
