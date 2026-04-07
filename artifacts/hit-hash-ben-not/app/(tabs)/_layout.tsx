import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useTheme } from "@/context/ThemeContext";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="expenses">
        <Icon sf={{ default: "square.grid.2x2", selected: "square.grid.2x2.fill" }} />
        <Label>Overview</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "plus.circle", selected: "plus.circle.fill" }} />
        <Label>Add</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="camera">
        <Icon sf={{ default: "camera.fill", selected: "camera.fill" }} />
        <Label>Camera</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="export">
        <Icon sf={{ default: "square.and.arrow.up", selected: "square.and.arrow.up.fill" }} />
        <Label>Export</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="more">
        <Icon sf={{ default: "ellipsis.circle", selected: "ellipsis.circle.fill" }} />
        <Label>More</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function CameraTabIcon({ focused }: { focused: boolean }) {
  const colors = useColors();
  return (
    <View style={[
      cameraIconStyles.wrapper,
      { backgroundColor: focused ? colors.primary : colors.primary + "CC" },
    ]}>
      <Feather name="camera" size={22} color="#fff" />
    </View>
  );
}

const cameraIconStyles = StyleSheet.create({
  wrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
});

function ClassicTabLayout() {
  const colors = useColors();
  const { theme } = useTheme();
  const safeAreaInsets = useSafeAreaInsets();
  const isDark = theme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: "Inter_500Medium",
          marginBottom: 2,
        },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.card,
          borderTopWidth: 0,
          elevation: 0,
          paddingBottom: safeAreaInsets.bottom,
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: colors.card,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: colors.border,
                },
              ]}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="expenses"
        options={{
          title: "Overview",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="square.grid.2x2" tintColor={color} size={22} />
            ) : (
              <Feather name="grid" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Add",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="plus.circle" tintColor={color} size={22} />
            ) : (
              <Feather name="plus-circle" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: "Camera",
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => <CameraTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="export"
        options={{
          title: "Export",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="square.and.arrow.up" tintColor={color} size={22} />
            ) : (
              <Feather name="send" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="ellipsis.circle" tintColor={color} size={22} />
            ) : (
              <Feather name="more-horizontal" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen name="trip" options={{ href: null }} />
      <Tabs.Screen name="exchanges" options={{ href: null }} />
      <Tabs.Screen name="money-transfers" options={{ href: null }} />
      <Tabs.Screen name="client-transfers" options={{ href: null }} />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
