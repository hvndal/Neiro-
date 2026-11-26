import { MPLUSRounded1c_500Medium } from '@expo-google-fonts/m-plus-rounded-1c';
import { Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, useFonts } from '@expo-google-fonts/nunito';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Launch } from '../motion/Launch';
import { initSkia } from '../skia/ready';
import { Watchers } from '../state/Watchers';
import { palette } from '../theme/tokens';

const SMALL_SHEET = { presentation: 'formSheet', sheetAllowedDetents: 'fitToContents', sheetGrabberVisible: true, sheetCornerRadius: 28 } as const;

export default function RootLayout() {
  const [loaded] = useFonts({ Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, MPLUSRounded1c_500Medium });
  const [launching, setLaunching] = useState(true);
  const done = useCallback(() => setLaunching(false), []);
  useEffect(() => {
    initSkia().catch((e) => console.warn('[neiro] Skia web init failed', e));
  }, []);
  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.paper }}>
      <SafeAreaProvider>
        <Watchers />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.paper } }}>
          <Stack.Screen name="(tabs)" />
          {/* Pro opens as a sheet from "get pro", any locked colour/mode, Customise (handover §3) */}
          <Stack.Screen name="pro" options={{ presentation: 'formSheet', sheetAllowedDetents: [0.94], sheetGrabberVisible: true, sheetCornerRadius: 28 }} />
          <Stack.Screen name="timer" options={{ ...SMALL_SHEET, contentStyle: { backgroundColor: 'transparent' } }} />
          <Stack.Screen name="mix" options={{ ...SMALL_SHEET, contentStyle: { backgroundColor: 'transparent' } }} />
        </Stack>
        {launching && <Launch onDone={done} />}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
