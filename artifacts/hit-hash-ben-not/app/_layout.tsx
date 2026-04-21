import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as BackgroundFetch from "expo-background-fetch";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as TaskManager from "expo-task-manager";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider } from "@/context/AppContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { SyncEngine } from "@/db/syncEngine";

const BACKGROUND_SYNC_TASK = "BACKGROUND_SYNC";

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  const session: string | null = null; // TODO: read from expo-secure-store once auth is wired
  if (!session) return BackgroundFetch.BackgroundFetchResult.NoData;
  try {
    const engine = new SyncEngine(session);
    await engine.syncAll();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

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
      <Stack.Screen name="cost-centers" />
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

  useEffect(() => {
    if (Platform.OS === "web") return;
    const session: string | null = null; // TODO: replace with real session check
    if (!session) return;
    BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 15 * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    }).catch(() => {});
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <AppProvider>
                  <RootLayoutNav />
                </AppProvider>
              </KeyboardProvider>
            </GestureHandlerRootView>
          </QueryClientProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
