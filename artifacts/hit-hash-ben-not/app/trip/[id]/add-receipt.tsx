import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ImageField, type ImageFieldHandle } from "@/components/ui/ImageField";
import { CashWalletDB, ReceiptDB } from "@/db/database";
import {
  CURRENCIES,
  RECEIPT_TYPES,
  type PaymentMethod,
  type ReceiptType,
} from "@/db/types";
import { useColors } from "@/hooks/useColors";

function today() {
  return new Date().toISOString().split("T")[0] ?? "";
}

export default function AddTripReceiptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const [date, setDate] = useState(today());
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>("USD");
  const [type, setType] = useState<ReceiptType>("MEALS");
  const [costCenter, setCostCenter] = useState("");
  const [photo, setPhoto] = useState("");
  const [selfDeclaration, setSelfDeclaration] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [saving, setSaving] = useState(false);

  const imageFieldRef = useRef<ImageFieldHandle>(null);

  useEffect(() => {
    setSelfDeclaration(photo.trim().length === 0);
  }, [photo]);

  async function doSave(photoPath: string, forceNoPhoto: boolean) {
    if (!id || !amount || isNaN(Number(amount))) return;
    setSaving(true);
    const effectiveSelfDecl = forceNoPhoto ? true : selfDeclaration;
    try {
      const newId = await ReceiptDB.insert({
        type,
        amount: Number(amount),
        currency,
        date,
        numberOfPeople: 1,
        costCenter,
        selfDeclaration: effectiveSelfDecl,
        note: note ? `[Trip #${id}] ${note}` : `[Trip #${id}]`,
        photo: photoPath || null,
        photo_checksum: null,
        budget: "",
        status: "",
        export: false,
        deleted_at: null,
        paymentMethod,
      });
      if (paymentMethod === "cash") {
        await CashWalletDB.insert({
          currency,
          amount: -parseFloat(Number(amount).toFixed(2)),
          entryType: "expense_cash",
          refId: newId,
          refTable: "Receipts",
          note: `Expense: ${type}`,
          createdAt: new Date().toISOString(),
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to save receipt. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleSave() {
    if (!amount || isNaN(Number(amount))) return;
    if (!photo.trim()) {
      Alert.alert(
        "No Receipt Photo",
        "Do you want to add a photo of the receipt?",
        [
          { text: "Add Photo", style: "default", onPress: () => imageFieldRef.current?.show() },
          { text: "Save Without Photo", style: "destructive", onPress: () => doSave("", true) },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }
    doSave(photo, false);
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
          Trip Receipt
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={saving || !amount} hitSlop={8}>
          <Text style={[styles.saveBtn, { color: !amount ? colors.mutedForeground : colors.primary }]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 40 }]}
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
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>COST CENTER</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
            value={costCenter}
            onChangeText={(v) => setCostCenter(v.replace(/[^0-9]/g, ""))}
            placeholder="e.g. 1234"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>PHOTO</Text>
          <ImageField ref={imageFieldRef} value={photo} onChange={setPhoto} />
        </View>
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>PAYMENT METHOD</Text>
          <View style={styles.chipRow}>
            <Pressable
              onPress={() => setPaymentMethod("card")}
              style={[styles.chip, { flex: 1, justifyContent: "center", backgroundColor: paymentMethod === "card" ? colors.primary : colors.card, borderColor: paymentMethod === "card" ? colors.primary : colors.border }]}
            >
              <Text style={[styles.chipText, { color: paymentMethod === "card" ? colors.primaryForeground : colors.foreground }]}>Card</Text>
            </Pressable>
            <Pressable
              onPress={() => setPaymentMethod("cash")}
              style={[styles.chip, { flex: 1, justifyContent: "center", backgroundColor: paymentMethod === "cash" ? colors.primary : colors.card, borderColor: paymentMethod === "cash" ? colors.primary : colors.border }]}
            >
              <Text style={[styles.chipText, { color: paymentMethod === "cash" ? colors.primaryForeground : colors.foreground }]}>Cash</Text>
            </Pressable>
          </View>
        </View>
        <View style={[styles.field, styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.toggleTitle, { color: colors.foreground }]}>Self declaration receipt</Text>
            <Text style={[styles.toggleSubtitle, { color: colors.mutedForeground }]}>
              {photo.trim() ? "Auto-disabled — photo attached" : "Auto-enabled — no photo"}
            </Text>
          </View>
          <Switch
            value={selfDeclaration}
            onValueChange={setSelfDeclaration}
            trackColor={{ false: colors.border, true: colors.primary + "80" }}
            thumbColor={selfDeclaration ? colors.primary : colors.mutedForeground}
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
  saveBtn: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  form: { padding: 16, gap: 16 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium", letterSpacing: 0.3 },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  chipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  toggleTitle: { fontSize: 15, fontFamily: "Inter_500Medium" },
  toggleSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
