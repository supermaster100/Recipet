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
          borderColor: colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.cardRow}>
        <View style={styles.currencyPair}>
          <View
            style={[styles.currencyBadge, { backgroundColor: colors.primary + "22" }]}
          >
            <Text style={[styles.currencyCode, { color: colors.primary }]}>
              {exchange.fromCurrency}
            </Text>
          </View>
          <Feather name="arrow-right" size={14} color={colors.mutedForeground} />
          <View
            style={[styles.currencyBadge, { backgroundColor: colors.secondary }]}
          >
            <Text style={[styles.currencyCode, { color: colors.foreground }]}>
              {exchange.toCurrency}
            </Text>
          </View>
        </View>
        <Text style={[styles.date, { color: colors.mutedForeground }]}>
          {exchange.date}
        </Text>
      </View>
      <View style={styles.amounts}>
        <Text style={[styles.fromAmount, { color: colors.mutedForeground }]}>
          {exchange.amountFrom.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {exchange.fromCurrency}
        </Text>
        <Text style={[styles.arrow, { color: colors.mutedForeground }]}>→</Text>
        <Text style={[styles.toAmount, { color: colors.foreground }]}>
          {exchange.amountTo.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {exchange.toCurrency}
        </Text>
      </View>
      <Text style={[styles.rate, { color: colors.mutedForeground }]}>
        Rate: 1 {exchange.fromCurrency} = {exchange.rate.toFixed(4)} {exchange.toCurrency}
        {exchange.description ? ` · ${exchange.description}` : ""}
      </Text>
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
            >
              <Feather name="plus" size={22} color={colors.primary} />
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
  list: {
    padding: 16,
    gap: 10,
  },
  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 8,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
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
    gap: 8,
  },
  fromAmount: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  arrow: {
    fontSize: 14,
  },
  toAmount: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  rate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
