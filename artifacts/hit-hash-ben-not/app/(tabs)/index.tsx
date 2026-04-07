import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppHeader } from "@/components/ui/AppHeader";
import { useAppContext } from "@/context/AppContext";
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
  const { expenses, travels, exchanges } = useAppContext();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const actions: QuickAction[] = [
    {
      icon: "file-text",
      label: "General Expense",
      color: "#3077FF",
      onPress: () => router.push("/add-expense"),
    },
    {
      icon: "camera",
      label: "Scan Receipt",
      color: "#34C759",
      onPress: () => router.push("/scan-receipt"),
    },
    {
      icon: "map",
      label: "New Trip",
      color: "#FF9500",
      onPress: () => router.push("/add-trip"),
    },
    {
      icon: "refresh-cw",
      label: "Currency Exchange",
      color: "#5856D6",
      onPress: () => router.push("/add-exchange"),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: topInset }}>
        <AppHeader title="Add" />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          QUICK ADD
        </Text>
        <View style={styles.actionsGrid}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.label}
              onPress={action.onPress}
              style={[
                styles.actionButton,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: action.color + "22" },
                ]}
              >
                <Feather name={action.icon} size={22} color={action.color} />
              </View>
              <Text
                style={[styles.actionLabel, { color: colors.foreground }]}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text
          style={[
            styles.sectionLabel,
            { color: colors.mutedForeground, marginTop: 8 },
          ]}
        >
          SUMMARY
        </Text>
        <View
          style={[
            styles.statsRow,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {expenses.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              Expenses
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {travels.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              Trips
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {exchanges.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              Exchanges
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 16,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginBottom: -4,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionButton: {
    width: "47%",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 12,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  statsRow: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  stat: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    gap: 4,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
  statValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
