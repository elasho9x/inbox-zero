import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/hooks/useTheme';
import { ThemeProvider } from '@/components/ThemeProvider';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { theme, setTheme } = useTheme();

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar
          style={theme === 'dark' ? 'light' : 'dark'}
          backgroundColor={theme === 'dark' ? '#1E3A8A' : '#FFFFFF'}
          translucent={false}
        />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: theme === 'dark' ? '#1E3A8A' : '#FFFFFF',
              borderBottomWidth: 0,
              elevation: 0,
            },
            headerTintColor: theme === 'dark' ? '#FFFFFF' : '#1E3A8A',
            headerTitleStyle: {
              fontWeight: '600',
              fontSize: 18,
            },
            contentStyle: {
              backgroundColor: theme === 'dark' ? '#0F172A' : '#F8FAFC',
            },
          }}
        >
          <Stack.Screen
            name="(auth)"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="(app)"
            options={{ headerShown: true }}
          />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}