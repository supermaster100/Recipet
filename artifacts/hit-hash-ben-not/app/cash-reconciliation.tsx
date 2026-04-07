import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppContext } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function CashReconciliationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const { cashWalletEntries, refreshCashWallet } = useAppContext();
  const [actualCash, setActualCash] = useState<Record<string, string>>({});

  useFocusEffect(useCallback(() => {
    refreshCashWallet();
  }, [refreshCashWallet]));

  const expectedBalances: Record<string, number> = {};
  for (const entry of cashWalletEntries) {
    expectedBalances[entry.currency] = (expectedBalances[entry.currency] ?? 0) + entry.amount;
  }

  const currencies = Object.keys(expectedBalances);

  const breakdown: Record<string, {
    brought: number;
    atm: number;
    received: number;
    spent: number;
    transferredOut: number;
    adjustments: number;
    expected: number;
  }> = {};

  for (const entry of cashWalletEntries) {
    const c = entry.currency;
    if (!breakdown[c]) {
      breakdown[c] = { brought: 0, atm: 0, received: 0, spent: 0, transferredOut: 0, adjustments: 0, expected: 0 };
    }
    const bd = breakdown[c]!;
    switch (entry.entryType) {
      case "initial":
        bd.brought += entry.amount;
        break;
      case "atm_withdrawal":
        bd.atm += entry.amount;
        break;
      case "money_transfer_in":
        bd.received += entry.amount;
        break;
      case "expense_cash":
        bd.spent += Math.abs(entry.amount);
        break;
      case "client_transfer_out":
        bd.transferredOut += Math.abs(entry.amount);
        break;
      case "manual_adjustment":
        bd.adjustments += entry.amount;
        break;
    }
    bd.expected = bd.brought + bd.atm + bd.received - bd.spent - bd.transferredOut + bd.adjustments;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Cash Reconciliation</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.infoBox, { backgroundColor: colors.accent, borderColor: colors.border }]}>
          <Feather name="info" size={16} color={colors.accentForeground} />
          <Text style={[styles.infoText, { color: colors.accentForeground }]}>
            Enter the actual cash you have on hand to compare with the app's calculated balance.
          </Text>
        </View>

        {currencies.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="inbox" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No cash wallet entries yet. Log initial cash from the Cash Wallet screen.
            </Text>
          </View>
        ) : (
          currencies.map((currency) => {
            const bd = breakdown[currency];
            if (!bd) return null;
            const actualStr = actualCash[currency] ?? "";
            const actualNum = actualStr.trim().length > 0 ? parseFloat(actualStr) : null;
            const discrepancy = actualNum !== null ? actualNum - bd.expected : null;

            return (
              <View key={currency} style={[styles.currencyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.currencyTitle, { color: colors.foreground }]}>{currency}</Text>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.breakdownSection}>
                  <Text style={[styles.breakdownLabel, { color: colors.mutedForeground }]}>Cash Brought</Text>
                  <Text style={[styles.breakdownValue, { color: colors.foreground }]}>
                    {bd.brought.toFixed(2)}
                  </Text>
                </View>
                {bd.atm > 0 && (
                  <View style={styles.breakdownSection}>
                    <Text style={[styles.breakdownLabel, { color: colors.mutedForeground }]}>ATM Withdrawals</Text>
                    <Text style={[styles.breakdownValue, { color: colors.success }]}>
                      +{bd.atm.toFixed(2)}
                    </Text>
                  </View>
                )}
                {bd.received > 0 && (
                  <View style={styles.breakdownSection}>
                    <Text style={[styles.breakdownLabel, { color: colors.mutedForeground }]}>Money Received</Text>
                    <Text style={[styles.breakdownValue, { color: colors.success }]}>
                      +{bd.received.toFixed(2)}
                    </Text>
                  </View>
                )}
                {bd.spent > 0 && (
                  <View style={styles.breakdownSection}>
                    <Text style={[styles.breakdownLabel, { color: colors.mutedForeground }]}>Cash Expenses</Text>
                    <Text style={[styles.breakdownValue, { color: colors.destructive }]}>
                      -{bd.spent.toFixed(2)}
                    </Text>
                  </View>
                )}
                {bd.transferredOut > 0 && (
                  <View style={styles.breakdownSection}>
                    <Text style={[styles.breakdownLabel, { color: colors.mutedForeground }]}>Transferred Out</Text>
                    <Text style={[styles.breakdownValue, { color: colors.destructive }]}>
                      -{bd.transferredOut.toFixed(2)}
                    </Text>
                  </View>
                )}
                {bd.adjustments !== 0 && (
                  <View style={styles.breakdownSection}>
                    <Text style={[styles.breakdownLabel, { color: colors.mutedForeground }]}>Adjustments</Text>
                    <Text style={[styles.breakdownValue, { color: bd.adjustments >= 0 ? colors.success : colors.destructive }]}>
                      {bd.adjustments >= 0 ? "+" : ""}{bd.adjustments.toFixed(2)}
                    </Text>
                  </View>
                )}

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.breakdownSection}>
                  <Text style={[styles.expectedLabel, { color: colors.foreground }]}>Expected on Hand</Text>
                  <Text style={[styles.expectedValue, { color: bd.expected >= 0 ? colors.foreground : colors.destructive }]}>
                    {bd.expected.toFixed(2)} {currency}
                  </Text>
                </View>

                <View style={[styles.inputSection, { borderTopColor: colors.border }]}>
                  <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
                    ACTUAL CASH ON HAND ({currency})
                  </Text>
                  <TextInput
                    style={[styles.actualInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                    value={actualStr}
                    onChangeText={(v) => setActualCash((prev) => ({ ...prev, [currency]: v }))}
                    placeholder="Enter actual amount"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="decimal-pad"
                  />
                </View>

                {discrepancy !== null && (
                  <View style={[
                    styles.discrepancyBox,
                    {
                      backgroundColor: Math.abs(discrepancy) < 0.01
                        ? colors.success + "22"
                        : discrepancy > 0
                        ? colors.warning + "22"
                        : colors.destructive + "22",
                      borderColor: Math.abs(discrepancy) < 0.01
                        ? colors.success
                        : discrepancy > 0
                        ? colors.warning
                        : colors.destructive,
                    },
                  ]}>
                    <Feather
                      name={Math.abs(discrepancy) < 0.01 ? "check-circle" : discrepancy > 0 ? "alert-circle" : "alert-triangle"}
                      size={18}
                      color={Math.abs(discrepancy) < 0.01 ? colors.success : discrepancy > 0 ? colors.warning : colors.destructive}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[
                        styles.discrepancyTitle,
                        { color: Math.abs(discrepancy) < 0.01 ? colors.success : discrepancy > 0 ? colors.warning : colors.destructive },
                      ]}>
                        {Math.abs(discrepancy) < 0.01
                          ? "Balanced!"
                          : discrepancy > 0
                          ? "Surplus"
                          : "Shortfall"}
                      </Text>
                      <Text style={[styles.discrepancyAmount, { color: colors.foreground }]}>
                        {discrepancy >= 0 ? "+" : ""}{discrepancy.toFixed(2)} {currency}
                      </Text>
                      {Math.abs(discrepancy) >= 0.01 && (
                        <Text style={[styles.discrepancyHint, { color: colors.mutedForeground }]}>
                          {discrepancy > 0
                            ? "You have more cash than expected."
                            : "You have less cash than expected. Check for unrecorded expenses."}
                        </Text>
                      )}
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
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
  content: { padding: 16, gap: 16 },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  infoText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 },
  emptyCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  currencyCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  currencyTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  breakdownSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  breakdownLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  breakdownValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  expectedLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  expectedValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  inputSection: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  inputLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  actualInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  discrepancyBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  discrepancyTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  discrepancyAmount: { fontSize: 16, fontFamily: "Inter_700Bold", marginTop: 2 },
  discrepancyHint: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4, lineHeight: 16 },
});
