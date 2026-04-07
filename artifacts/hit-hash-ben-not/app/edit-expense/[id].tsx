import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
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
  type GeneralExpense,
} from "@/db/types";
import { useColors } from "@/hooks/useColors";

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { refreshExpenses, expenses } = useAppContext();

  const expense = expenses.find((e) => e.id === Number(id));
  const [date, setDate] = useState(expense?.date ?? "");
  const [description, setDescription] = useState(expense?.description ?? "");
  const [amount, setAmount] = useState(String(expense?.amount ?? ""));
  const [currency, setCurrency] = useState(expense?.currency ?? "ILS");
  const [category, setCategory] = useState<ExpenseCategory>(expense?.category ?? "OTHER");
  const [division, setDivision] = useState(expense?.division ?? "");
  const [costCenter, setCostCenter] = useState(expense?.costCenter ?? "");
  const [notes, setNotes] = useState(expense?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  async function handleSave() {
    if (!expense || !amount || isNaN(Number(amount))) return;
    setSaving(true);
    try {
      await GeneralExpenseDB.update({
        id: expense.id,
        date,
        month: expense.month,
        year: expense.year,
        description,
        amount: Number(amount),
        currency,
        category,
        division,
        costCenter,
        notes,
        receiptPath: expense.receiptPath,
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

  async function handleDelete() {
    if (!expense) return;
    Alert.alert("Delete Expense", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await GeneralExpenseDB.delete(expense.id);
          await refreshExpenses();
          router.back();
        },
      },
    ]);
  }

  if (!expense) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground, textAlign: "center", marginTop: 100 }}>
          Expense not found
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
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Edit Expense
        </Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleDelete} hitSlop={8}>
            <Feather name="trash-2" size={20} color={colors.destructive} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving || !amount}
            hitSlop={8}
          >
            <Text
              style={[
                styles.saveBtn,
                { color: !amount ? colors.mutedForeground : colors.primary },
              ]}
            >
              Save
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.form,
          { paddingBottom: insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>DATE</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>DESCRIPTION</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
            value={description}
            onChangeText={setDescription}
            placeholder="What was this expense for?"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>AMOUNT</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>CURRENCY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {CURRENCIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCurrency(c)}
                  style={[styles.chip, { backgroundColor: currency === c ? colors.primary : colors.card, borderColor: currency === c ? colors.primary : colors.border }]}
                >
                  <Text style={[styles.chipText, { color: currency === c ? colors.primaryForeground : colors.foreground }]}>{c}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {EXPENSE_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.key}
                  onPress={() => setCategory(cat.key)}
                  style={[styles.chip, { backgroundColor: category === cat.key ? colors.primary : colors.card, borderColor: category === cat.key ? colors.primary : colors.border }]}
                >
                  <Text style={[styles.chipText, { color: category === cat.key ? colors.primaryForeground : colors.foreground }]}>{cat.label}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>DIVISION</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
            value={division}
            onChangeText={setDivision}
            placeholder="e.g. Marketing"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>COST CENTER</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
            value={costCenter}
            onChangeText={setCostCenter}
            placeholder="e.g. CC-1234"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>NOTES</Text>
          <TextInput
            style={[styles.input, styles.textArea, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
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
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 16 },
  saveBtn: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  form: { padding: 16, gap: 16 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium", letterSpacing: 0.3 },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  chipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
