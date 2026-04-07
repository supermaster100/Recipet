import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider } from "@/context/AppContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="add-expense" options={{ presentation: "modal" }} />
      <Stack.Screen name="edit-expense/[id]" options={{ presentation: "modal" }} />
      <Stack.Screen name="add-hotel-night" options={{ presentation: "modal" }} />
      <Stack.Screen name="edit-hotel-night/[id]" options={{ presentation: "modal" }} />
      <Stack.Screen name="add-exchange" options={{ presentation: "modal" }} />
      <Stack.Screen name="edit-exchange/[id]" options={{ presentation: "modal" }} />
      <Stack.Screen name="add-atm" options={{ presentation: "modal" }} />
      <Stack.Screen name="edit-atm/[id]" options={{ presentation: "modal" }} />
      <Stack.Screen name="add-money-transfer" options={{ presentation: "modal" }} />
      <Stack.Screen name="add-client-transfer" options={{ presentation: "modal" }} />
      <Stack.Screen name="export" options={{ presentation: "modal" }} />
      <Stack.Screen name="budgets" />
      <Stack.Screen name="general-data" />
      <Stack.Screen name="scan-receipt" options={{ presentation: "modal" }} />
      <Stack.Screen name="trash" />
      <Stack.Screen name="trip/[id]/summary" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#1C1C1C" }}>
            <KeyboardProvider>
              <AppProvider>
                <RootLayoutNav />
              </AppProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
