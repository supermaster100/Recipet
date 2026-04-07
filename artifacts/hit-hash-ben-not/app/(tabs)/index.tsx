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
  emoji: string;
  label: string;
  onPress: () => void;
  colorKey: "primary" | "success" | "warning" | "purple" | "destructive";
}

export default function AddScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const actions: QuickAction[] = [
    {
      emoji: "🧾",
      label: "General Expense",
      colorKey: "primary",
      onPress: () => router.push("/add-expense"),
    },
    {
      emoji: "🏧",
      label: "ATM Withdrawal",
      colorKey: "success",
      onPress: () => router.push("/add-atm"),
    },
    {
      emoji: "✈️",
      label: "Trip",
      colorKey: "warning",
      onPress: () => router.push("/(tabs)/trip"),
    },
    {
      emoji: "💱",
      label: "Currency Exchange",
      colorKey: "purple",
      onPress: () => router.push("/add-exchange"),
    },
    {
      emoji: "🤝",
      label: "Client Transfer",
      colorKey: "destructive",
      onPress: () => router.push("/add-client-transfer"),
    },
    {
      emoji: "📤",
      label: "Teammate Transfer",
      colorKey: "success",
      onPress: () => router.push("/add-money-transfer"),
    },
  ];

  const rows = [
    [actions[0]!, actions[1]!],
    [actions[2]!, actions[3]!],
    [actions[4]!, actions[5]!],
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
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((action) => {
            const tint = colors[action.colorKey];
            return (
              <TouchableOpacity
                key={action.label}
                onPress={action.onPress}
                style={[
                  styles.card,
                  { backgroundColor: tint + "22" },
                ]}
                activeOpacity={0.75}
              >
                <Text style={styles.emoji}>{action.emoji}</Text>
                <Text style={[styles.label, { color: tint }]} numberOfLines={2}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 12,
  },
  row: {
    flex: 1,
    flexDirection: "row",
    gap: 14,
  },
  card: {
    flex: 1,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 16,
  },
  emoji: {
    fontSize: 46,
    lineHeight: 56,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    lineHeight: 18,
  },
});
