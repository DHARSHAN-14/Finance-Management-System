import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../constants/theme';

export default function RootLayout() {
  const { isAuthenticated, isLoading, loadUser, user } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    loadUser();
  }, []);

  useEffect(() => {
    if (!isMounted || isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAdminGroup = segments[0] === '(admin)';
    const inClientGroup = segments[0] === '(client)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      if (user?.role === 'CLIENT') {
        router.replace('/(client)/home');
      } else {
        router.replace('/(admin)/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, segments, user, isMounted]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="(client)" />
    </Stack>
  );
}
