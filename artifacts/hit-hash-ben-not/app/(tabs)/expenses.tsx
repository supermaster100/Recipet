import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AmountBadge } from "@/components/ui/AmountBadge";
import { AppHeader } from "@/components/ui/AppHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAppContext } from "@/context/AppContext";
import { RECEIPT_TYPES, type Receipt, type ReceiptType } from "@/db/types";
import { useColors } from "@/hooks/useColors";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function PhotoThumb({ uri }: { uri: string | null }) {
  const colors = useColors();
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={styles.thumb}
        contentFit="cover"
      />
    );
  }
  return (
    <View style={[styles.thumb, styles.thumbPlaceholder, { backgroundColor: colors.secondary }]}>
      <Feather name="file-text" size={20} color={colors.mutedForeground} />
    </View>
  );
}

function ExpenseCard({
  expense,
  onPress,
}: {
  expense: Receipt;
  onPress: () => void;
}) {
  const colors = useColors();
  const typeInfo = RECEIPT_TYPES.find((r) => r.key === expense.type);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <PhotoThumb uri={expense.photo} />
      <View style={styles.cardContent}>
        <View style={styles.cardRow}>
          <Text
            style={[styles.cardType, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {typeInfo?.label ?? expense.type}
          </Text>
          <AmountBadge amount={expense.amount} currency={expense.currency} size="sm" />
        </View>
        <View style={styles.cardRow}>
          <Text style={[styles.cardDate, { color: colors.mutedForeground }]}>
            {expense.date}
          </Text>
          {expense.selfDeclaration && (
            <View style={[styles.selfDeclBadge, { backgroundColor: colors.warning + "28" }]}>
              <Text style={[styles.selfDeclText, { color: colors.warning }]}>Self Decl.</Text>
            </View>
          )}
          {!expense.photo && (
            <View style={[styles.noPhotoBadge, { backgroundColor: colors.muted }]}>
              <Feather name="image" size={10} color={colors.mutedForeground} />
              <Text style={[styles.noPhotoText, { color: colors.mutedForeground }]}>No photo</Text>
            </View>
          )}
        </View>
        {expense.note ? (
          <Text style={[styles.cardNote, { color: colors.mutedForeground }]} numberOfLines={1}>
            {expense.note}
          </Text>
        ) : null}
      </View>
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
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
  const [activeFilters, setActiveFilters] = useState<Set<ReceiptType>>(new Set());
  const [showFilter, setShowFilter] = useState(false);

  const monthStr = String(selectedYear) + "-" + String(selectedMonth).padStart(2, "0");

  const byMonth = useMemo(
    () => receipts.filter((e) => e.date.startsWith(monthStr)),
    [receipts, monthStr]
  );

  const filtered = useMemo(() => {
    if (activeFilters.size === 0) return byMonth;
    return byMonth.filter((e) => activeFilters.has(e.type));
  }, [byMonth, activeFilters]);

  const total = useMemo(() => {
    const byCurrency: Record<string, number> = {};
    for (const e of filtered) {
      byCurrency[e.currency] = (byCurrency[e.currency] ?? 0) + e.amount;
    }
    return byCurrency;
  }, [filtered]);

  function prevMonth() {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear((y) => y - 1); }
    else { setSelectedMonth((m) => m - 1); }
  }
  function nextMonth() {
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear((y) => y + 1); }
    else { setSelectedMonth((m) => m + 1); }
  }

  function toggleFilter(t: ReceiptType) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const hasFilters = activeFilters.size > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: topInset }}>
        <AppHeader
          title="Expenses"
          right={
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => setShowFilter((v) => !v)}
                hitSlop={8}
                style={[
                  styles.filterBtn,
                  {
                    backgroundColor: hasFilters ? colors.primary + "20" : "transparent",
                    borderColor: hasFilters ? colors.primary : colors.border,
                  },
                ]}
              >
                <Feather
                  name="filter"
                  size={16}
                  color={hasFilters ? colors.primary : colors.mutedForeground}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/add-expense")} hitSlop={8}>
                <Feather name="plus" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>
          }
        />

        {showFilter && (
          <View style={[styles.filterBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>
              Filter by type:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
              <Pressable
                onPress={() => setActiveFilters(new Set())}
                style={[
                  styles.chip,
                  {
                    backgroundColor: !hasFilters ? colors.primary : colors.secondary,
                    borderColor: !hasFilters ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: !hasFilters ? "#fff" : colors.foreground }]}>
                  All
                </Text>
              </Pressable>
              {RECEIPT_TYPES.map((rt) => {
                const active = activeFilters.has(rt.key);
                return (
                  <Pressable
                    key={rt.key}
                    onPress={() => toggleFilter(rt.key)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? colors.primary : colors.secondary,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: active ? "#fff" : colors.foreground }]}>
                      {rt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={[styles.monthNav, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
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
          <View style={[styles.summary, { backgroundColor: colors.secondary }]}>
            {Object.entries(total).map(([cur, amt]) => (
              <AmountBadge key={cur} amount={amt} currency={cur} size="lg" />
            ))}
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
              {filtered.length} expense{filtered.length !== 1 ? "s" : ""}
              {hasFilters ? " (filtered)" : ""}
            </Text>
          </View>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        scrollEnabled
        ListEmptyComponent={
          isDbReady ? (
            <EmptyState
              icon="file-text"
              title={hasFilters ? "No matching expenses" : "No expenses"}
              subtitle={
                hasFilters
                  ? "Try changing your filters or adding a new receipt"
                  : `No expenses recorded for ${MONTHS[selectedMonth - 1]} ${selectedYear}`
              }
              actionLabel={!hasFilters ? "Add Receipt" : undefined}
              onAction={!hasFilters ? () => router.push("/add-expense") : undefined}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <ExpenseCard expense={item} onPress={() => router.push(`/edit-expense/${item.id}`)} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  filterBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
  },
  filterLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    paddingHorizontal: 16,
  },
  filterChips: {
    flexDirection: "row",
    paddingHorizontal: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
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
    paddingVertical: 10,
    gap: 12,
    flexWrap: "wrap",
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginLeft: "auto",
  },
  list: {
    padding: 12,
    gap: 8,
    flexGrow: 1,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 12,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  thumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardType: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  cardDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  cardNote: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  selfDeclBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  selfDeclText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  noPhotoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  noPhotoText: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
});
