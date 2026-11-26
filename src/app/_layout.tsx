import { MPLUSRounded1c_500Medium } from '@expo-google-fonts/m-plus-rounded-1c';
import { Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, useFonts } from '@expo-google-fonts/nunito';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initSkia } from '../skia/ready';
import { palette } from '../theme/tokens';

export default function RootLayout() {
  const [loaded] = useFonts({ Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, MPLUSRounded1c_500Medium });
  useEffect(() => {
    initSkia().catch((e) => console.warn('[neiro] Skia web init failed', e));
  }, []);
  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.paper }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.paper } }}>
          <Stack.Screen name="(tabs)" />
          {/* Pro opens as a modal sheet: "get pro", any locked colour/mode, Customise (handover §3) */}
          <Stack.Screen
            name="pro"
            options={{ presentation: 'formSheet', sheetAllowedDetents: [0.94], sheetGrabberVisible: true, sheetCornerRadius: 28 }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
