import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="city-selection" />
      <Stack.Screen name="route-confirmation" />
      <Stack.Screen name="avatar-selection" />
      <Stack.Screen name="profile-setup" />
      <Stack.Screen name="tutorial" />
    </Stack>
  );
}
