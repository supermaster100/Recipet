import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

interface QuickAction {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  color: string;
}

export default function AddScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const actions: QuickAction[] = [
    {
      icon: "file-text",
      label: "General Expense",
      color: colors.primary,
      onPress: () => router.push("/add-expense"),
    },
    {
      icon: "credit-card",
      label: "ATM Withdrawal",
      color: colors.success,
      onPress: () => router.push("/add-atm"),
    },
    {
      icon: "map",
      label: "Trip",
      color: colors.warning,
      onPress: () => router.push("/(tabs)/trip"),
    },
    {
      icon: "refresh-cw",
      label: "Currency Exchange",
      color: colors.purple,
      onPress: () => router.push("/add-exchange"),
    },
    {
      icon: "user",
      label: "Client Transfer",
      color: colors.destructive,
      onPress: () => router.push("/add-client-transfer"),
    },
    {
      icon: "send",
      label: "Teammate Transfer",
      color: colors.success,
      onPress: () => router.push("/add-money-transfer"),
    },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: topInset + 16,
          paddingBottom: insets.bottom + 16,
        },
      ]}
    >
      <View style={styles.grid}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.label}
            onPress={action.onPress}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                shadowColor: colors.shadowColor,
              },
            ]}
            activeOpacity={0.75}
          >
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: action.color + "18" },
              ]}
            >
              <Feather name={action.icon} size={26} color={action.color} />
            </View>
            <Text style={[styles.label, { color: colors.foreground }]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  grid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    alignContent: "center",
  },
  card: {
    width: "47.5%",
    borderRadius: 18,
    padding: 22,
    gap: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 20,
  },
});
