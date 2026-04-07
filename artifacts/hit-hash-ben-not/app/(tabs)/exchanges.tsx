import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/ui/EmptyState";
import { useAppContext } from "@/context/AppContext";
import { ExchangeDB, ATMDB } from "@/db/database";
import type { ATMWithdrawal, Exchange } from "@/db/types";
import { useColors } from "@/hooks/useColors";

type ListItem =
  | { kind: "section-exchange" }
  | { kind: "exchange"; data: Exchange }
  | { kind: "section-atm" }
  | { kind: "atm"; data: ATMWithdrawal }
  | { kind: "empty" };

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ExchangeRow({
  exchange,
  selected,
  onToggle,
  onPress,
}: {
  exchange: Exchange;
  selected: boolean;
  onToggle: () => void;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onToggle}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: selected ? colors.primary + "22" : colors.card,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Pressable onPress={onToggle} style={styles.checkBox} hitSlop={8}>
        <View
          style={[
            styles.checkCircle,
            { borderColor: selected ? colors.primary : colors.mutedForeground },
            selected && { backgroundColor: colors.primary },
          ]}
        >
          {selected && <Feather name="check" size={12} color="#fff" />}
        </View>
      </Pressable>
      <View style={styles.cardContent}>
        <View style={styles.cardRow}>
          <View style={styles.currencyPair}>
            <View style={[styles.currencyBadge, { backgroundColor: colors.primary + "18" }]}>
              <Text style={[styles.currencyCode, { color: colors.primary }]}>{exchange.spentCurrency}</Text>
            </View>
            <Feather name="arrow-right" size={12} color={colors.mutedForeground} />
            <View style={[styles.currencyBadge, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.currencyCode, { color: colors.foreground }]}>{exchange.receivedCurrency}</Text>
            </View>
          </View>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>{exchange.date}</Text>
        </View>
        <View style={styles.amounts}>
          <Text style={[styles.fromAmount, { color: colors.mutedForeground }]}>
            {fmt(exchange.amountSpent)} {exchange.spentCurrency}
          </Text>
          <Feather name="arrow-right" size={13} color={colors.mutedForeground} />
          <Text style={[styles.toAmount, { color: colors.foreground }]}>
            {fmt(exchange.amountReceived)} {exchange.receivedCurrency}
          </Text>
        </View>
        {exchange.note ? (
          <Text style={[styles.note, { color: colors.mutedForeground }]} numberOfLines={1}>
            {exchange.note}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function ATMRow({
  item,
  onPress,
}: {
  item: ATMWithdrawal;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.atmIcon, { backgroundColor: colors.secondary }]}>
        <Feather name="credit-card" size={16} color={colors.mutedForeground} />
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardRow}>
          <Text style={[styles.toAmount, { color: colors.foreground }]}>
            {fmt(item.amount)} {item.currency}
          </Text>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>{item.date}</Text>
        </View>
        <Text style={[styles.note, { color: colors.mutedForeground }]}>
          Card ending ••••{item.cardLastFour}
        </Text>
      </View>
    </Pressable>
  );
}

export default function ExchangesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { exchanges, atmWithdrawals, isDbReady, refreshExchanges, refreshATM } = useAppContext();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  function toggleSelected(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDeleteSelected() {
    if (selectedIds.size === 0) return;
    Alert.alert("Delete Selected", `Delete ${selectedIds.size} exchange(s)?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          for (const id of selectedIds) await ExchangeDB.softDelete(id);
          setSelectedIds(new Set());
          await refreshExchanges();
        },
      },
    ]);
  }

  async function handleClear() {
    if (exchanges.length === 0 && atmWithdrawals.length === 0) return;
    Alert.alert("Clear All", "Delete all exchanges and ATM withdrawals?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          for (const e of exchanges) await ExchangeDB.hardDelete(e.id);
          for (const a of atmWithdrawals) await ATMDB.delete(a.id);
          setSelectedIds(new Set());
          await Promise.all([refreshExchanges(), refreshATM()]);
        },
      },
    ]);
  }

  const isEmpty = exchanges.length === 0 && atmWithdrawals.length === 0;

  const listData = useMemo((): ListItem[] => {
    if (isEmpty) return [{ kind: "empty" }];
    const items: ListItem[] = [];
    if (exchanges.length > 0) {
      items.push({ kind: "section-exchange" });
      for (const ex of exchanges) items.push({ kind: "exchange", data: ex });
    }
    if (atmWithdrawals.length > 0) {
      items.push({ kind: "section-atm" });
      for (const a of atmWithdrawals) items.push({ kind: "atm", data: a });
    }
    return items;
  }, [exchanges, atmWithdrawals, isEmpty]);

  function renderItem({ item }: { item: ListItem }) {
    if (item.kind === "empty") {
      return isDbReady ? (
        <EmptyState
          icon="refresh-cw"
          title="No exchanges"
          subtitle="Record currency exchanges and ATM withdrawals"
        />
      ) : null;
    }
    if (item.kind === "section-exchange") {
      return (
        <View style={[styles.sectionHeader]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>CURRENCY EXCHANGES</Text>
        </View>
      );
    }
    if (item.kind === "section-atm") {
      return (
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ATM WITHDRAWALS</Text>
          <TouchableOpacity
            onPress={() => router.push("/add-atm")}
            hitSlop={8}
            style={[styles.sectionAddBtn, { backgroundColor: colors.secondary }]}
          >
            <Feather name="plus" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      );
    }
    if (item.kind === "exchange") {
      const ex = item.data;
      return (
        <ExchangeRow
          exchange={ex}
          selected={selectedIds.has(ex.id)}
          onToggle={() => toggleSelected(ex.id)}
          onPress={() => router.push(`/edit-exchange/${ex.id}`)}
        />
      );
    }
    if (item.kind === "atm") {
      return (
        <ATMRow
          item={item.data}
          onPress={() => router.push(`/edit-atm/${item.data.id}`)}
        />
      );
    }
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 8, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Exchanges</Text>
        <TouchableOpacity
          onPress={() => router.push("/add-exchange")}
          hitSlop={8}
          style={[styles.addButton, { backgroundColor: colors.primary + "18" }]}
        >
          <Feather name="plus" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.actionBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={handleDeleteSelected}
          disabled={selectedIds.size === 0}
          style={styles.actionBtn}
        >
          <Feather
            name="trash-2"
            size={15}
            color={selectedIds.size > 0 ? colors.destructive : colors.mutedForeground}
          />
          <Text
            style={[
              styles.actionBtnText,
              { color: selectedIds.size > 0 ? colors.destructive : colors.mutedForeground },
            ]}
          >
            Delete Selected{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/add-atm")} style={styles.actionBtn}>
          <Feather name="credit-card" size={15} color={colors.primary} />
          <Text style={[styles.actionBtnText, { color: colors.primary }]}>ATM Withdrawal</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleClear} style={styles.actionBtn}>
          <Feather name="x-circle" size={15} color={colors.mutedForeground} />
          <Text style={[styles.actionBtnText, { color: colors.mutedForeground }]}>Clear</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item, idx) => {
          if (item.kind === "exchange") return `ex-${item.data.id}`;
          if (item.kind === "atm") return `atm-${item.data.id}`;
          return `${item.kind}-${idx}`;
        }}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100, flexGrow: 1 }]}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionBtnText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  list: { padding: 16, gap: 10 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  sectionAddBtn: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  checkBox: { justifyContent: "center", alignItems: "center" },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  atmIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: { flex: 1, gap: 4 },
  cardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  currencyPair: { flexDirection: "row", alignItems: "center", gap: 5 },
  currencyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  currencyCode: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  date: { fontSize: 11, fontFamily: "Inter_400Regular" },
  amounts: { flexDirection: "row", alignItems: "center", gap: 5 },
  fromAmount: { fontSize: 13, fontFamily: "Inter_400Regular" },
  toAmount: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  note: { fontSize: 12, fontFamily: "Inter_400Regular", fontStyle: "italic" },
});
