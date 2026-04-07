import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
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
import { ReceiptDB } from "@/db/database";
import {
  CURRENCIES,
  RECEIPT_TYPES,
  type ReceiptType,
} from "@/db/types";
import { useColors } from "@/hooks/useColors";

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { refreshReceipts, receipts } = useAppContext();

  const receipt = receipts.find((e) => e.id === Number(id));
  const [date, setDate] = useState(receipt?.date ?? "");
  const [note, setNote] = useState(receipt?.note ?? "");
  const [amount, setAmount] = useState(String(receipt?.amount ?? ""));
  const [currency, setCurrency] = useState(receipt?.currency ?? "ILS");
  const [type, setType] = useState<ReceiptType>(receipt?.type ?? "OTHER");
  const [division, setDivision] = useState(receipt?.division ?? "");
  const [costCenter, setCostCenter] = useState(receipt?.costCenter ?? "");
  const [numberOfPeople, setNumberOfPeople] = useState(String(receipt?.numberOfPeople ?? "1"));
  const [selfDeclaration, setSelfDeclaration] = useState(receipt?.selfDeclaration ?? false);
  const [saving, setSaving] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  async function handleSave() {
    if (!receipt || !amount || isNaN(Number(amount))) return;
    setSaving(true);
    try {
      await ReceiptDB.update({
        id: receipt.id,
        type,
        amount: Number(amount),
        currency,
        date,
        numberOfPeople: Number(numberOfPeople) || 1,
        division,
        costCenter,
        selfDeclaration,
        note,
        photo: receipt.photo,
        status: receipt.status,
        export: receipt.export,
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

  async function handleDelete() {
    if (!receipt) return;
    Alert.alert("Delete Receipt", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await ReceiptDB.delete(receipt.id);
          await refreshReceipts();
          router.back();
        },
      },
    ]);
  }

  if (!receipt) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground, textAlign: "center", marginTop: 100 }}>
          Receipt not found
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
          Edit Receipt
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
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>NOTE</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
            value={note}
            onChangeText={setNote}
            placeholder="What was this receipt for?"
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
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>TYPE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {RECEIPT_TYPES.map((rt) => (
                <Pressable
                  key={rt.key}
                  onPress={() => setType(rt.key)}
                  style={[styles.chip, { backgroundColor: type === rt.key ? colors.primary : colors.card, borderColor: type === rt.key ? colors.primary : colors.border }]}
                >
                  <Text style={[styles.chipText, { color: type === rt.key ? colors.primaryForeground : colors.foreground }]}>{rt.label}</Text>
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
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>NUMBER OF PEOPLE</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
            value={numberOfPeople}
            onChangeText={setNumberOfPeople}
            placeholder="1"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>SELF DECLARATION</Text>
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
            <Text style={[styles.chipText, { color: colors.foreground }]}>
              Self declaration receipt
            </Text>
          </Pressable>
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
  chipRow: { flexDirection: "row", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  chipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  toggle: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 12 },
});
