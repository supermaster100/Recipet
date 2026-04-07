import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AmountBadge } from "@/components/ui/AmountBadge";
import { useAppContext } from "@/context/AppContext";
import { ExchangeDB } from "@/db/database";
import { useColors } from "@/hooks/useColors";

export default function EditExchangeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { exchanges, refreshExchanges } = useAppContext();

  const exchange = exchanges.find((e) => e.id === Number(id));
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  async function handleDelete() {
    if (!exchange) return;
    Alert.alert("Delete Exchange", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await ExchangeDB.delete(exchange.id);
          await refreshExchanges();
          router.back();
        },
      },
    ]);
  }

  if (!exchange) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground, textAlign: "center", marginTop: 100 }}>
          Exchange not found
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topInset + 8, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Exchange Detail
        </Text>
        <TouchableOpacity onPress={handleDelete} hitSlop={8}>
          <Feather name="trash-2" size={20} color={colors.destructive} />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.pairRow}>
            <View style={[styles.currencyBadge, { backgroundColor: colors.primary + "22" }]}>
              <Text style={[styles.currencyCode, { color: colors.primary }]}>
                {exchange.spentCurrency}
              </Text>
            </View>
            <Feather name="arrow-right" size={18} color={colors.mutedForeground} />
            <View style={[styles.currencyBadge, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.currencyCode, { color: colors.foreground }]}>
                {exchange.receivedCurrency}
              </Text>
            </View>
          </View>
          <View style={styles.amountRow}>
            <AmountBadge amount={exchange.amountSpent} currency={exchange.spentCurrency} size="lg" />
            <Text style={[styles.arrow, { color: colors.mutedForeground }]}>→</Text>
            <AmountBadge amount={exchange.amountReceived} currency={exchange.receivedCurrency} size="lg" />
          </View>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>
            {exchange.date}
          </Text>
          {exchange.note ? (
            <Text style={[styles.desc, { color: colors.foreground }]}>
              {exchange.note}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  content: { flex: 1, padding: 16 },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    gap: 14,
    alignItems: "center",
  },
  pairRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  currencyBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  currencyCode: { fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  amountRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  arrow: { fontSize: 18 },
  date: { fontSize: 13, fontFamily: "Inter_400Regular" },
  desc: { fontSize: 14, fontFamily: "Inter_500Medium", textAlign: "center" },
});
