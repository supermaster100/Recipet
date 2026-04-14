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
import { CashWalletDB, MoneyTransferDB } from "@/db/database";
import { CURRENCIES } from "@/db/types";
import { CURRENCY_NAMES } from "@/db/currencyNames";
import { useFavouriteCurrencies, sortWithFavourites } from "@/hooks/useFavouriteCurrencies";
import { useColors } from "@/hooks/useColors";

function today(): string {
  return new Date().toISOString().split("T")[0] ?? "";
}

function nowIso(): string {
  return new Date().toISOString();
}

export default function AddMoneyTransferScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { refreshMoneyTransfers, general, refreshCashWallet } = useAppContext();
  const params = useLocalSearchParams<{ photo?: string }>();
  const { favourites, isFavourite } = useFavouriteCurrencies();

  const [receiptName, setReceiptName] = useState("");
  const [giverName, setGiverName] = useState("");
  const [giverWorkerNumber, setGiverWorkerNumber] = useState(general?.workerNumber ?? "");
  const [receiverName, setReceiverName] = useState("");
  const [receiverWorkerNumber, setReceiverWorkerNumber] = useState("");
  const [date, setDate] = useState(today());
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>("ILS");
  const [photo, setPhoto] = useState(params.photo ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  const imageFieldRef = useRef<ImageFieldHandle>(null);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const isValid =
    receiptName.trim().length > 0 &&
    giverName.trim().length > 0 &&
    giverWorkerNumber.trim().length > 0 &&
    receiverName.trim().length > 0 &&
    date.trim().length > 0 &&
    amount.trim().length > 0 &&
    Number(amount) > 0;

  async function doSave(photoPath: string) {
    setSaving(true);
    try {
      const newId = await MoneyTransferDB.insert({
        receiptName: receiptName.trim(),
        giverName: giverName.trim(),
        workerNumber: giverWorkerNumber.trim(),
        receiverName: receiverName.trim(),
        receiverWorkerNumber: receiverWorkerNumber.trim(),
        date,
        amount: parseFloat(Number(amount).toFixed(2)),
        currency,
        photo: photoPath || null,
        createdAt: nowIso(),
      });
      await CashWalletDB.insert({
        currency,
        amount: parseFloat(Number(amount).toFixed(2)),
        entryType: "money_transfer_in",
        refId: newId,
        refTable: "MoneyTransfers",
        note: `Money received from ${giverName.trim()}`,
        createdAt: nowIso(),
      });
      await refreshMoneyTransfers();
      await refreshCashWallet();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSaved(true);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to save money transfer. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/money-transfers");
    }
  }

  function handleSave() {
    if (!isValid) {
      setShowErrors(true);
      return;
    }
    if (!photo.trim()) {
      if (Platform.OS === "web") {
        const confirmed = window.confirm(
          "No approval note photo. Save without photo?"
        );
        if (confirmed) {
          doSave("");
        }
        return;
      }
      Alert.alert(
        "No Approval Note Photo",
        "Do you want to add a photo of the approval note?",
        [
          { text: "Add Photo", style: "default", onPress: () => imageFieldRef.current?.show() },
          { text: "Save Without Photo", style: "destructive", onPress: () => doSave("") },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }
    doSave(photo);
  }

  if (saved) {
    const goBack = () => { if (router.canGoBack()) { router.back(); } else { router.replace("/(tabs)/money-transfers"); } };
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
          <Text style={[styles.successTitle, { color: colors.foreground }]}>Transfer Saved</Text>
          <Text style={[styles.successSub, { color: colors.mutedForeground }]}>Your money transfer has been saved.</Text>
          <TouchableOpacity onPress={goBack} style={[styles.successBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.successBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
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
        <TouchableOpacity onPress={goBack} hitSlop={8} accessibilityLabel="close">
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          New Money Transfer
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          hitSlop={8}
          style={styles.saveBtnWrap}
        >
          {saving ? (
            <ActivityIndicator color={isValid ? colors.primary : colors.mutedForeground} size="small" />
          ) : (
            <Text
              style={[
                styles.saveBtn,
                { color: isValid && !saving ? colors.primary : colors.mutedForeground },
              ]}
            >
              Save
            </Text>
          )}
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
            APPROVAL NOTE PHOTO
          </Text>
          <ImageField ref={imageFieldRef} value={photo} onChange={setPhoto} label="Approval Note Photo" />
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            RECEIPT NAME <Text style={{ color: colors.destructive }}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.foreground, backgroundColor: colors.card, borderColor: showErrors && !receiptName.trim() ? colors.destructive : colors.border },
            ]}
            value={receiptName}
            onChangeText={setReceiptName}
            placeholder="Name on receipt"
            placeholderTextColor={colors.mutedForeground}
          />
          {showErrors && !receiptName.trim() ? (
            <Text style={[styles.errorText, { color: colors.destructive }]}>Receipt name is required</Text>
          ) : null}
        </View>

        <View style={[styles.section, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Giver</Text>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
              NAME <Text style={{ color: colors.destructive }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                { color: colors.foreground, backgroundColor: colors.background, borderColor: showErrors && !giverName.trim() ? colors.destructive : colors.border },
              ]}
              value={giverName}
              onChangeText={setGiverName}
              placeholder="Giver's name"
              placeholderTextColor={colors.mutedForeground}
            />
            {showErrors && !giverName.trim() ? (
              <Text style={[styles.errorText, { color: colors.destructive }]}>Giver name is required</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
              WORKER NUMBER <Text style={{ color: colors.destructive }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                { color: colors.foreground, backgroundColor: colors.background, borderColor: showErrors && !giverWorkerNumber.trim() ? colors.destructive : colors.border },
              ]}
              value={giverWorkerNumber}
              onChangeText={setGiverWorkerNumber}
              placeholder="Giver's worker number"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
            />
            {showErrors && !giverWorkerNumber.trim() ? (
              <Text style={[styles.errorText, { color: colors.destructive }]}>Giver worker number is required</Text>
            ) : null}
          </View>
        </View>

        <View style={[styles.section, { borderColor: showErrors && !receiverName.trim() ? colors.destructive : colors.border, backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.success }]}>Receiver</Text>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
              NAME <Text style={{ color: colors.destructive }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                { color: colors.foreground, backgroundColor: colors.background, borderColor: showErrors && !receiverName.trim() ? colors.destructive : colors.border },
              ]}
              value={receiverName}
              onChangeText={setReceiverName}
              placeholder="Receiver's name"
              placeholderTextColor={colors.mutedForeground}
            />
            {showErrors && !receiverName.trim() ? (
              <Text style={[styles.errorText, { color: colors.destructive }]}>Receiver name is required</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
              WORKER NUMBER
            </Text>
            <TextInput
              style={[
                styles.input,
                { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border },
              ]}
              value={receiverWorkerNumber}
              onChangeText={setReceiverWorkerNumber}
              placeholder="Receiver's worker number (optional)"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            DATE <Text style={{ color: colors.destructive }}>*</Text>
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
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            AMOUNT <Text style={{ color: colors.destructive }}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.foreground, backgroundColor: colors.card, borderColor: showErrors && !(amount.trim().length > 0 && Number(amount) > 0) ? colors.destructive : colors.border },
            ]}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
          />
          {showErrors && !(amount.trim().length > 0 && Number(amount) > 0) ? (
            <Text style={[styles.errorText, { color: colors.destructive }]}>A valid amount greater than 0 is required</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            CURRENCY
          </Text>
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
              {sortWithFavourites([...CURRENCIES], favourites)
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
                    <Text
                      style={[
                        styles.chipText,
                        { color: currency === c ? colors.primaryForeground : colors.foreground },
                      ]}
                    >
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
  saveBtnWrap: { minWidth: 40, alignItems: "center", justifyContent: "center" },
  successBody: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  successIcon: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  successTitle: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  successSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  successBtn: { marginTop: 16, paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12 },
  successBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
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
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  section: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  errorText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
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
