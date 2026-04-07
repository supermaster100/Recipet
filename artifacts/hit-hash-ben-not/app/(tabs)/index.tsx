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
  const { receipts, travels, exchanges } = useAppContext();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const actions: QuickAction[] = [
    {
      icon: "file-text",
      label: "General Expense",
      color: colors.primary,
      onPress: () => router.push("/add-expense"),
    },
    {
      icon: "camera",
      label: "Scan Receipt",
      color: colors.success,
      onPress: () => router.push("/scan-receipt"),
    },
    {
      icon: "map",
      label: "New Trip",
      color: colors.warning,
      onPress: () => router.push("/add-trip"),
    },
    {
      icon: "refresh-cw",
      label: "Currency Exchange",
      color: colors.purple,
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
                  shadowColor: colors.shadowColor,
                },
              ]}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: action.color + "18" },
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
            {
              backgroundColor: colors.card,
              shadowColor: colors.shadowColor,
            },
          ]}
        >
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {receipts.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              Expenses
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {travels.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              Trips
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
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
    padding: 20,
    gap: 14,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginBottom: -2,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionButton: {
    width: "47%",
    borderRadius: 16,
    padding: 18,
    gap: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: "row",
    borderRadius: 16,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  stat: {
    flex: 1,
    paddingVertical: 20,
    alignItems: "center",
    gap: 4,
  },
  statDivider: {
    width: 1,
    marginVertical: 16,
  },
  statValue: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
