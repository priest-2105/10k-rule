import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { CountingProvider } from '@/contexts/CountingContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <CountingProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="addSkill" 
            options={{ 
              presentation: 'modal', 
              title: 'New Skill',
              headerShown: false,
            }} 
          />
          <Stack.Screen 
            name="skillDetail" 
            options={{ 
              presentation: 'card',
              title: 'Skill Details',
              headerShown: false,
            }} 
          />
          <Stack.Screen 
            name="counting" 
            options={{ 
              presentation: 'fullScreenModal',
              title: 'Counting',
              headerShown: false,
              gestureEnabled: false,
            }} 
          />
          <Stack.Screen 
            name="modal" 
            options={{ 
              presentation: 'modal', 
              title: 'Modal',
              headerShown: false,
            }} 
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </CountingProvider>
  );
}
