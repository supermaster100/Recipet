import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { EXCHANGE_CURRENCIES } from "@/db/types";
import { CURRENCY_NAMES } from "@/db/currencyNames";
import { useFavouriteCurrencies, sortWithFavourites } from "@/hooks/useFavouriteCurrencies";
import { useColors } from "@/hooks/useColors";

function today(): string {
  return new Date().toISOString().split("T")[0] ?? "";
}

export default function AddATMScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { refreshATM, refreshCashWallet } = useAppContext();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const imageFieldRef = useRef<ImageFieldHandle>(null);
  const params = useLocalSearchParams<{ photo?: string }>();
  const { favourites, isFavourite } = useFavouriteCurrencies();

  const [date, setDate] = useState(today());
  const [cardLastFour, setCardLastFour] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<(typeof EXCHANGE_CURRENCIES)[number]>("USD");
  const [photo, setPhoto] = useState(params.photo ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");

  const canSave = !!date && cardLastFour.length === 4 && !!amount && !saving;

  async function doSave(photoPath: string) {
    setSaving(true);
    try {
      const newId = await ATMDB.insert({
        date,
        cardLastFour,
        amount: Number(amount),
        currency,
        photo: photoPath || null,
        createdAt: new Date().toISOString(),
      });
      await CashWalletDB.insert({
        currency,
        amount: Number(amount),
        entryType: "atm_withdrawal",
        refId: newId,
        refTable: "ATMWithdrawals",
        note: `ATM withdrawal (card ****${cardLastFour})`,
        createdAt: new Date().toISOString(),
      });
      await refreshATM();
      await refreshCashWallet();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSaved(true);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to save ATM withdrawal. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleSave() {
    if (!canSave) return;
    if (!photo.trim()) {
      if (Platform.OS === "web") {
        if (window.confirm("No slip photo. Save without photo?")) doSave("");
        return;
      }
      Alert.alert(
        "No Slip Photo",
        "Do you want to add a photo of the ATM slip?",
        [
          { text: "Add Photo", onPress: () => imageFieldRef.current?.show() },
          { text: "Save Without Photo", style: "destructive", onPress: () => doSave("") },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }
    doSave(photo);
  }

  if (saved) {
    const goBack = () => { if (router.canGoBack()) { router.back(); } else { router.replace("/(tabs)/exchanges"); } };
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topInset + 8, borderBottomColor: colors.border }]}>
          <View style={{ width: 22 }} />
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Saved</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.successBody}>
          <View style={[styles.successIcon, { backgroundColor: colors.success + "22" }]}>
            <Feather name="check-circle" size={48} color={colors.success} />
          </View>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>ATM Withdrawal Saved</Text>
          <Text style={[styles.successSub, { color: colors.mutedForeground }]}>Your record has been saved.</Text>
          <TouchableOpacity onPress={goBack} style={[styles.successBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.successBtnText}>Done</Text>
          </TouchableOpacity>
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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>ATM Withdrawal</Text>
        <TouchableOpacity onPress={handleSave} disabled={!canSave} hitSlop={8} style={styles.saveBtnWrap}>
          {saving ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Text style={[styles.saveBtn, { color: canSave ? colors.primary : colors.mutedForeground }]}>
              Save
            </Text>
          )}
        </TouchableOpacity>
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

        <View style={styles.amountRow}>
          <View style={styles.amountField}>
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
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>CURRENCY *</Text>
          <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="search" size={14} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              value={currencySearch}
              onChangeText={setCurrencySearch}
              placeholder="Search…"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {currencySearch.length > 0 && (
              <Pressable onPress={() => setCurrencySearch("")} hitSlop={8}>
                <Feather name="x" size={14} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {sortWithFavourites([...EXCHANGE_CURRENCIES], favourites)
                .filter((c) => {
                  const q = currencySearch.trim().toLowerCase();
                  if (!q) return true;
                  if (c.toLowerCase().includes(q)) return true;
                  return (CURRENCY_NAMES[c] ?? "").toLowerCase().includes(q);
                })
                .map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setCurrency(c)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: currency === c ? colors.primary : colors.card,
                        borderColor: currency === c ? colors.primary : isFavourite(c) ? colors.warning : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: currency === c ? colors.primaryForeground : colors.foreground }]}>
                      {c}
                    </Text>
                    {isFavourite(c) && currency !== c && (
                      <Feather name="star" size={10} color={colors.warning} />
                    )}
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
  saveBtn: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  saveBtnWrap: { minWidth: 40, alignItems: "center", justifyContent: "center" },
  successBody: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  successIcon: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  successTitle: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  successSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  successBtn: { marginTop: 16, paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12 },
  successBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
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
  amountRow: { flexDirection: "row", gap: 10 },
  amountField: { flex: 1, gap: 6 },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  chipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    padding: 0,
  },
});
