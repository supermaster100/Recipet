import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
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

import { TripReceiptDB } from "@/db/database";
import {
  CURRENCIES,
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
} from "@/db/types";
import { useColors } from "@/hooks/useColors";

function today() { return new Date().toISOString().split("T")[0] ?? ""; }

export default function AddTripReceiptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const [date, setDate] = useState(today());
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>("USD");
  const [category, setCategory] = useState<ExpenseCategory>("MEALS");
  const [division, setDivision] = useState("");
  const [costCenter, setCostCenter] = useState("");
  const [selfDeclaration, setSelfDeclaration] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!id || !amount || isNaN(Number(amount))) return;
    setSaving(true);
    try {
      await TripReceiptDB.insert({
        travelId: Number(id),
        date,
        description,
        amount: Number(amount),
        currency,
        category,
        division,
        costCenter,
        selfDeclaration,
        receiptPath: null,
        notes,
      });
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
      <View style={[styles.header, { paddingTop: topInset + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Add Receipt</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving || !amount} hitSlop={8}>
          <Text style={[styles.saveBtn, { color: !amount ? colors.mutedForeground : colors.primary }]}>Save</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">
        {[
          { label: "Date", value: date, setter: setDate, placeholder: "YYYY-MM-DD" },
          { label: "Description", value: description, setter: setDescription, placeholder: "What was this receipt for?" },
          { label: "Amount", value: amount, setter: setAmount, placeholder: "0.00", numeric: true },
        ].map((f) => (
          <View key={f.label} style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{f.label.toUpperCase()}</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
              value={f.value}
              onChangeText={f.setter}
              placeholder={f.placeholder}
              placeholderTextColor={colors.mutedForeground}
              keyboardType={f.numeric ? "decimal-pad" : "default"}
            />
          </View>
        ))}
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>CURRENCY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {CURRENCIES.map((c) => (
                <Pressable key={c} onPress={() => setCurrency(c)} style={[styles.chip, { backgroundColor: currency === c ? colors.primary : colors.card, borderColor: currency === c ? colors.primary : colors.border }]}>
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
                <Pressable key={cat.key} onPress={() => setCategory(cat.key)} style={[styles.chip, { backgroundColor: category === cat.key ? colors.primary : colors.card, borderColor: category === cat.key ? colors.primary : colors.border }]}>
                  <Text style={[styles.chipText, { color: category === cat.key ? colors.primaryForeground : colors.foreground }]}>{cat.label}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
        {[
          { label: "Division", value: division, setter: setDivision, placeholder: "e.g. Marketing" },
          { label: "Cost Center", value: costCenter, setter: setCostCenter, placeholder: "e.g. CC-1234" },
          { label: "Notes", value: notes, setter: setNotes, placeholder: "Optional notes" },
        ].map((f) => (
          <View key={f.label} style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{f.label.toUpperCase()}</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
              value={f.value}
              onChangeText={f.setter}
              placeholder={f.placeholder}
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
        ))}
        <Pressable
          onPress={() => setSelfDeclaration(!selfDeclaration)}
          style={[styles.toggle, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.checkbox, { borderColor: selfDeclaration ? colors.primary : colors.border, backgroundColor: selfDeclaration ? colors.primary : "transparent" }]}>
            {selfDeclaration && <Feather name="check" size={12} color="#fff" />}
          </View>
          <Text style={[styles.toggleLabel, { color: colors.foreground }]}>Self Declaration (no receipt)</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  saveBtn: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  form: { padding: 16, gap: 12 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium", letterSpacing: 0.3 },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  toggle: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, padding: 14 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  toggleLabel: { fontSize: 15, fontFamily: "Inter_400Regular" },
});
