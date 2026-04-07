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
import { GeneralExpenseDB } from "@/db/database";
import {
  CURRENCIES,
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
} from "@/db/types";
import { useColors } from "@/hooks/useColors";

function today(): string {
  return new Date().toISOString().split("T")[0] ?? "";
}

function getMonthYear() {
  const d = new Date();
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

export default function AddExpenseScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { refreshExpenses } = useAppContext();

  const [date, setDate] = useState(today());
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>("ILS");
  const [category, setCategory] = useState<ExpenseCategory>("OTHER");
  const [division, setDivision] = useState("");
  const [costCenter, setCostCenter] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  async function handleSave() {
    if (!amount || isNaN(Number(amount))) return;
    setSaving(true);
    try {
      const { month, year } = getMonthYear();
      await GeneralExpenseDB.insert({
        date,
        month,
        year,
        description,
        amount: Number(amount),
        currency,
        category,
        division,
        costCenter,
        notes,
        receiptPath: null,
      });
      await refreshExpenses();
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
          New Expense
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
                color:
                  !amount ? colors.mutedForeground : colors.primary,
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

        <Field label="Description">
          <TextInput
            style={[
              styles.input,
              {
                color: colors.foreground,
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="What was this expense for?"
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
                        currency === c
                          ? colors.primary
                          : colors.card,
                      borderColor:
                        currency === c
                          ? colors.primary
                          : colors.border,
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

        <Field label="Category">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {EXPENSE_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.key}
                  onPress={() => setCategory(cat.key)}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor:
                        category === cat.key
                          ? colors.primary
                          : colors.card,
                      borderColor:
                        category === cat.key
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      {
                        color:
                          category === cat.key
                            ? colors.primaryForeground
                            : colors.foreground,
                      },
                    ]}
                  >
                    {cat.label}
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

        <Field label="Notes">
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                color: colors.foreground,
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
          />
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
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
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
});
