import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppContext } from "@/context/AppContext";
import { ExchangeDB } from "@/db/database";
import { CURRENCIES } from "@/db/types";
import { useColors } from "@/hooks/useColors";

function today(): string {
  return new Date().toISOString().split("T")[0] ?? "";
}

export default function AddExchangeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { refreshExchanges } = useAppContext();

  const [date, setDate] = useState(today());
  const [fromCurrency, setFromCurrency] = useState<(typeof CURRENCIES)[number]>("USD");
  const [toCurrency, setToCurrency] = useState<(typeof CURRENCIES)[number]>("ILS");
  const [amountFrom, setAmountFrom] = useState("");
  const [rate, setRate] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const amountTo =
    amountFrom && rate
      ? (Number(amountFrom) * Number(rate)).toFixed(2)
      : "—";

  async function handleSave() {
    if (!amountFrom || !rate) return;
    setSaving(true);
    try {
      await ExchangeDB.insert({
        date,
        fromCurrency,
        toCurrency,
        amountFrom: Number(amountFrom),
        rate: Number(rate),
        amountTo: Number(amountFrom) * Number(rate),
        description,
      });
      await refreshExchanges();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
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
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          New Exchange
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || !amountFrom || !rate}
          hitSlop={8}
        >
          <Text
            style={[
              styles.saveBtn,
              {
                color:
                  !amountFrom || !rate
                    ? colors.mutedForeground
                    : colors.primary,
              },
            ]}
          >
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.form,
          { paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            Date
          </Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
            ]}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            From Currency
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {CURRENCIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setFromCurrency(c)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: fromCurrency === c ? colors.primary : colors.card,
                      borderColor: fromCurrency === c ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: fromCurrency === c ? colors.primaryForeground : colors.foreground },
                    ]}
                  >
                    {c}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            To Currency
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {CURRENCIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setToCurrency(c)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: toCurrency === c ? colors.primary : colors.card,
                      borderColor: toCurrency === c ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: toCurrency === c ? colors.primaryForeground : colors.foreground },
                    ]}
                  >
                    {c}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            Amount ({fromCurrency})
          </Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
            ]}
            value={amountFrom}
            onChangeText={setAmountFrom}
            placeholder="0.00"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            Rate (1 {fromCurrency} = ? {toCurrency})
          </Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
            ]}
            value={rate}
            onChangeText={setRate}
            placeholder="0.0000"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
          />
        </View>

        <View
          style={[
            styles.resultBox,
            { backgroundColor: colors.primary + "11", borderColor: colors.primary + "33" },
          ]}
        >
          <Text style={[styles.resultLabel, { color: colors.mutedForeground }]}>
            Result
          </Text>
          <Text style={[styles.resultValue, { color: colors.primary }]}>
            {amountTo} {toCurrency}
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            Description
          </Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="Optional note"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>
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
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  saveBtn: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  form: {
    padding: 16,
    gap: 16,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  resultBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    gap: 4,
  },
  resultLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  resultValue: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
});
