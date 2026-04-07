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
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ImageField, type ImageFieldHandle } from "@/components/ui/ImageField";
import { useAppContext } from "@/context/AppContext";
import { ATMDB, CashWalletDB } from "@/db/database";
import type { ATMWithdrawal } from "@/db/types";
import { EXCHANGE_CURRENCIES } from "@/db/types";
import { useColors } from "@/hooks/useColors";

export default function EditATMScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { refreshATM, refreshCashWallet } = useAppContext();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const imageFieldRef = useRef<ImageFieldHandle>(null);

  const [atm, setATM] = useState<ATMWithdrawal | null>(null);
  const [date, setDate] = useState("");
  const [cardLastFour, setCardLastFour] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<(typeof EXCHANGE_CURRENCIES)[number]>("USD");
  const [photo, setPhoto] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    ATMDB.getById(Number(id)).then((record) => {
      if (!record) return;
      setATM(record);
      setDate(record.date);
      setCardLastFour(record.cardLastFour);
      setAmount(String(record.amount));
      setCurrency(record.currency as (typeof EXCHANGE_CURRENCIES)[number]);
      setPhoto(record.photo ?? "");
    });
  }, [id]);

  const canSave = !!date && cardLastFour.length === 4 && !!amount && !saving;

  async function handleSave() {
    if (!atm || !canSave) return;
    setSaving(true);
    try {
      const newAmount = Number(amount);
      await ATMDB.update({
        ...atm,
        date,
        cardLastFour,
        amount: newAmount,
        currency,
        photo: photo || null,
      });
      await CashWalletDB.deleteByRef(atm.id, "ATMWithdrawals");
      await CashWalletDB.insert({
        currency,
        amount: newAmount,
        entryType: "atm_withdrawal",
        refId: atm.id,
        refTable: "ATMWithdrawals",
        note: `ATM withdrawal (card ****${cardLastFour})`,
        createdAt: new Date().toISOString(),
      });
      await refreshATM();
      await refreshCashWallet();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to save ATM withdrawal. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    if (!atm) return;
    Alert.alert("Delete Withdrawal", "Delete this ATM withdrawal record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await CashWalletDB.deleteByRef(atm.id, "ATMWithdrawals");
          await ATMDB.delete(atm.id);
          await refreshATM();
          await refreshCashWallet();
          router.back();
        },
      },
    ]);
  }

  if (!atm) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topInset + 8, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>ATM Withdrawal</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.loading}>
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading…</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Edit ATM Withdrawal</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleDelete} hitSlop={8}>
            <Feather name="trash-2" size={20} color={colors.destructive} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!canSave}
            style={[styles.saveBtn, { backgroundColor: canSave ? colors.primary : colors.primary + "50" }]}
          >
            <Text style={[styles.saveBtnText, { color: "#fff" }]}>
              {saving ? "Saving…" : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>DATE *</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>LAST 4 DIGITS OF CARD *</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
            value={cardLastFour}
            onChangeText={(v) => setCardLastFour(v.replace(/\D/g, "").slice(0, 4))}
            placeholder="1234"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="number-pad"
            maxLength={4}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>AMOUNT *</Text>
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
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>CURRENCY *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {EXCHANGE_CURRENCIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCurrency(c)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: currency === c ? colors.primary : colors.card,
                      borderColor: currency === c ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: currency === c ? colors.primaryForeground : colors.foreground }]}>
                    {c}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>SLIP PHOTO</Text>
          <ImageField ref={imageFieldRef} value={photo} onChange={setPhoto} />
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
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  saveBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  saveBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  form: { padding: 16, gap: 16 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium", letterSpacing: 0.3 },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  chipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: 15, fontFamily: "Inter_400Regular" },
});
