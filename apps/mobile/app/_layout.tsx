import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../constants/theme';

export default function RootLayout() {
  const { isAuthenticated, isHydrating, loadUser, user } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    loadUser();
  }, []);

  useEffect(() => {
    if (!isMounted || isHydrating) return;
    // Expo Router often reports [] briefly; without this, post-login redirect never runs.
    if (segments.length === 0) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      if (user?.role === 'CLIENT') {
        router.replace('/(client)/home');
      } else {
        router.replace('/(admin)/dashboard');
      }
    }
  }, [isAuthenticated, isHydrating, segments, user, isMounted]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="(client)" />
    </Stack>
  );
}
