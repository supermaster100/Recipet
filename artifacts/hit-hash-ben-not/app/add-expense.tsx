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
import { ReceiptDB } from "@/db/database";
import {
  CURRENCIES,
  RECEIPT_TYPES,
  type ReceiptType,
} from "@/db/types";
import { useColors } from "@/hooks/useColors";

function today(): string {
  return new Date().toISOString().split("T")[0] ?? "";
}

export default function AddExpenseScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { refreshReceipts } = useAppContext();

  const [date, setDate] = useState(today());
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>("ILS");
  const [type, setType] = useState<ReceiptType>("OTHER");
  const [division, setDivision] = useState("");
  const [costCenter, setCostCenter] = useState("");
  const [numberOfPeople, setNumberOfPeople] = useState("1");
  const [selfDeclaration, setSelfDeclaration] = useState(false);
  const [saving, setSaving] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  async function handleSave() {
    if (!amount || isNaN(Number(amount))) return;
    setSaving(true);
    try {
      await ReceiptDB.insert({
        type,
        amount: Number(amount),
        currency,
        date,
        numberOfPeople: Number(numberOfPeople) || 1,
        division,
        costCenter,
        selfDeclaration,
        note,
        photo: null,
        status: "",
        export: false,
      });
      await refreshReceipts();
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
          New Receipt
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || !amount}
          hitSlop={8}
        >
          <Text
            style={[
              styles.saveBtn,
              {
                color: !amount ? colors.mutedForeground : colors.primary,
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
        <Field label="Date">
          <TextInput
            style={[
              styles.input,
              {
                color: colors.foreground,
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.mutedForeground}
          />
        </Field>

        <Field label="Note">
          <TextInput
            style={[
              styles.input,
              {
                color: colors.foreground,
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            value={note}
            onChangeText={setNote}
            placeholder="What was this receipt for?"
            placeholderTextColor={colors.mutedForeground}
          />
        </Field>

        <Field label="Amount">
          <View style={styles.amountRow}>
            <TextInput
              style={[
                styles.input,
                styles.amountInput,
                {
                  color: colors.foreground,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="decimal-pad"
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.currencyScroll}
            >
              {CURRENCIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCurrency(c)}
                  style={[
                    styles.currencyChip,
                    {
                      backgroundColor:
                        currency === c ? colors.primary : colors.card,
                      borderColor:
                        currency === c ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.currencyChipText,
                      {
                        color:
                          currency === c
                            ? colors.primaryForeground
                            : colors.foreground,
                      },
                    ]}
                  >
                    {c}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Field>

        <Field label="Type">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {RECEIPT_TYPES.map((rt) => (
                <Pressable
                  key={rt.key}
                  onPress={() => setType(rt.key)}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor:
                        type === rt.key ? colors.primary : colors.card,
                      borderColor:
                        type === rt.key ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      {
                        color:
                          type === rt.key
                            ? colors.primaryForeground
                            : colors.foreground,
                      },
                    ]}
                  >
                    {rt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </Field>

        <Field label="Division">
          <TextInput
            style={[
              styles.input,
              {
                color: colors.foreground,
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            value={division}
            onChangeText={setDivision}
            placeholder="e.g. Marketing"
            placeholderTextColor={colors.mutedForeground}
          />
        </Field>

        <Field label="Cost Center">
          <TextInput
            style={[
              styles.input,
              {
                color: colors.foreground,
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            value={costCenter}
            onChangeText={setCostCenter}
            placeholder="e.g. CC-1234"
            placeholderTextColor={colors.mutedForeground}
          />
        </Field>

        <Field label="Number of People">
          <TextInput
            style={[
              styles.input,
              {
                color: colors.foreground,
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            value={numberOfPeople}
            onChangeText={setNumberOfPeople}
            placeholder="1"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="number-pad"
          />
        </Field>

        <Field label="Self Declaration">
          <Pressable
            onPress={() => setSelfDeclaration((v) => !v)}
            style={[
              styles.toggle,
              {
                backgroundColor: selfDeclaration ? colors.primary + "22" : colors.card,
                borderColor: selfDeclaration ? colors.primary : colors.border,
              },
            ]}
          >
            <Feather
              name={selfDeclaration ? "check-square" : "square"}
              size={18}
              color={selfDeclaration ? colors.primary : colors.mutedForeground}
            />
            <Text style={[styles.toggleLabel, { color: colors.foreground }]}>
              Self declaration receipt
            </Text>
          </Pressable>
        </Field>
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      {children}
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
  amountRow: {
    gap: 8,
  },
  amountInput: {
    flex: 1,
  },
  currencyScroll: {
    flexGrow: 0,
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
  },
  currencyChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  currencyChipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  toggleLabel: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
});
