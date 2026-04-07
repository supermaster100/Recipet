import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
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

import { AppHeader } from "@/components/ui/AppHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAppContext } from "@/context/AppContext";
import type { Exchange } from "@/db/types";
import { useColors } from "@/hooks/useColors";

function ExchangeCard({
  exchange,
  onPress,
}: {
  exchange: Exchange;
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
          shadowColor: colors.shadowColor,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.cardRow}>
        <View style={styles.currencyPair}>
          <View
            style={[styles.currencyBadge, { backgroundColor: colors.primary + "18" }]}
          >
            <Text style={[styles.currencyCode, { color: colors.primary }]}>
              {exchange.spentCurrency}
            </Text>
          </View>
          <View style={[styles.arrowBox, { backgroundColor: colors.secondary }]}>
            <Feather name="arrow-right" size={12} color={colors.mutedForeground} />
          </View>
          <View
            style={[styles.currencyBadge, { backgroundColor: colors.secondary }]}
          >
            <Text style={[styles.currencyCode, { color: colors.foreground }]}>
              {exchange.receivedCurrency}
            </Text>
          </View>
        </View>
        <Text style={[styles.date, { color: colors.mutedForeground }]}>
          {exchange.date}
        </Text>
      </View>
      <View style={styles.amounts}>
        <Text style={[styles.fromAmount, { color: colors.mutedForeground }]}>
          {exchange.amountSpent.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {exchange.spentCurrency}
        </Text>
        <Feather name="arrow-right" size={14} color={colors.mutedForeground} style={styles.amountArrow} />
        <Text style={[styles.toAmount, { color: colors.foreground }]}>
          {exchange.amountReceived.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {exchange.receivedCurrency}
        </Text>
      </View>
      {exchange.note ? (
        <Text style={[styles.note, { color: colors.mutedForeground }]}>
          {exchange.note}
        </Text>
      ) : null}
    </Pressable>
  );
}

export default function ExchangesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { exchanges, isDbReady } = useAppContext();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: topInset }}>
        <AppHeader
          title="Exchanges"
          right={
            <TouchableOpacity
              onPress={() => router.push("/add-exchange")}
              hitSlop={8}
              style={[styles.addButton, { backgroundColor: colors.primary + "18" }]}
            >
              <Feather name="plus" size={18} color={colors.primary} />
            </TouchableOpacity>
          }
        />
      </View>

      <FlatList
        data={exchanges}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 100, flexGrow: 1 },
        ]}
        scrollEnabled={exchanges.length > 0}
        ListEmptyComponent={
          isDbReady ? (
            <EmptyState
              icon="refresh-cw"
              title="No exchanges"
              subtitle="Record currency exchanges to track your forex transactions"
            />
          ) : null
        }
        renderItem={({ item }) => (
          <ExchangeCard
            exchange={item}
            onPress={() => router.push(`/edit-exchange/${item.id}`)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    padding: 20,
    gap: 10,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  currencyPair: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  currencyBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  arrowBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  currencyCode: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  date: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  amounts: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  fromAmount: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  amountArrow: {
    opacity: 0.6,
  },
  toAmount: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  note: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
});
