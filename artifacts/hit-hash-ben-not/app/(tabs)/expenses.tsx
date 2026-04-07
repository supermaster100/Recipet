import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AmountBadge } from "@/components/ui/AmountBadge";
import { AppHeader } from "@/components/ui/AppHeader";
import { CategoryPill } from "@/components/ui/CategoryPill";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAppContext } from "@/context/AppContext";
import type { Receipt } from "@/db/types";
import { useColors } from "@/hooks/useColors";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function ExpenseCard({
  expense,
  onPress,
}: {
  expense: Receipt;
  onPress: () => void;
}) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <Text
            style={[styles.cardDescription, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {expense.note || "—"}
          </Text>
          <Text style={[styles.cardDate, { color: colors.mutedForeground }]}>
            {expense.date}
          </Text>
        </View>
        <AmountBadge
          amount={expense.amount}
          currency={expense.currency}
          size="md"
        />
      </View>
      <View style={styles.cardBottom}>
        <CategoryPill category={expense.type} />
        {expense.division ? (
          <Text style={[styles.division, { color: colors.mutedForeground }]}>
            {expense.division}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function ExpensesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { receipts, isDbReady } = useAppContext();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const monthStr = String(selectedYear) + "-" + String(selectedMonth).padStart(2, "0");

  const filtered = useMemo(() => {
    return receipts.filter((e) => e.date.startsWith(monthStr));
  }, [receipts, monthStr]);

  const total = useMemo(() => {
    const byCurrency: Record<string, number> = {};
    for (const e of filtered) {
      byCurrency[e.currency] = (byCurrency[e.currency] ?? 0) + e.amount;
    }
    return byCurrency;
  }, [filtered]);

  function prevMonth() {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  }

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: topInset }}>
        <AppHeader
          title="Expenses"
          right={
            <TouchableOpacity
              onPress={() => router.push("/add-expense")}
              hitSlop={8}
            >
              <Feather name="plus" size={22} color={colors.primary} />
            </TouchableOpacity>
          }
        />

        <View
          style={[
            styles.monthNav,
            { backgroundColor: colors.card, borderBottomColor: colors.border },
          ]}
        >
          <TouchableOpacity onPress={prevMonth} hitSlop={12}>
            <Feather name="chevron-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.monthLabel, { color: colors.foreground }]}>
            {MONTHS[selectedMonth - 1]} {selectedYear}
          </Text>
          <TouchableOpacity onPress={nextMonth} hitSlop={12}>
            <Feather name="chevron-right" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {Object.keys(total).length > 0 && (
          <View
            style={[styles.summary, { backgroundColor: colors.secondary }]}
          >
            {Object.entries(total).map(([cur, amt]) => (
              <AmountBadge key={cur} amount={amt} currency={cur} size="lg" />
            ))}
            <Text
              style={[styles.summaryLabel, { color: colors.mutedForeground }]}
            >
              {filtered.length} expense{filtered.length !== 1 ? "s" : ""}
            </Text>
          </View>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 100 },
        ]}
        scrollEnabled={filtered.length > 0}
        ListEmptyComponent={
          isDbReady ? (
            <EmptyState
              icon="file-text"
              title="No expenses"
              subtitle={`No expenses recorded for ${MONTHS[selectedMonth - 1]} ${selectedYear}`}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <ExpenseCard
            expense={item}
            onPress={() => router.push(`/edit-expense/${item.id}`)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  monthLabel: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  summaryLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginLeft: "auto",
  },
  list: {
    padding: 16,
    gap: 10,
    flexGrow: 1,
  },
  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 10,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  cardLeft: {
    flex: 1,
    gap: 3,
  },
  cardDescription: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  cardDate: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  division: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
