import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: true }}>
        <Stack.Screen name="index" options={{ title: 'Composer' }} />
        <Stack.Screen name="reactions" options={{ title: 'Reactions' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
