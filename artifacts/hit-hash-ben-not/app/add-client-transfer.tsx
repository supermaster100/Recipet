import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
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
import { CashWalletDB, ClientTransferDB } from "@/db/database";
import { CURRENCIES } from "@/db/types";
import { useColors } from "@/hooks/useColors";

function today(): string {
  return new Date().toISOString().split("T")[0] ?? "";
}

function nowIso(): string {
  return new Date().toISOString();
}

export default function AddClientTransferScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { refreshClientTransfers, refreshCashWallet } = useAppContext();

  const [clientName, setClientName] = useState("");
  const [giverName, setGiverName] = useState("");
  const [date, setDate] = useState(today());
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>("ILS");
  const [photo, setPhoto] = useState("");
  const [saving, setSaving] = useState(false);

  const imageFieldRef = useRef<ImageFieldHandle>(null);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const isValid =
    clientName.trim().length > 0 &&
    giverName.trim().length > 0 &&
    date.trim().length > 0 &&
    amount.trim().length > 0 &&
    Number(amount) > 0;

  async function doSave(photoPath: string) {
    setSaving(true);
    try {
      const newId = await ClientTransferDB.insert({
        clientName: clientName.trim(),
        giverName: giverName.trim(),
        date,
        amount: parseFloat(Number(amount).toFixed(2)),
        currency,
        photo: photoPath || null,
        createdAt: nowIso(),
      });
      await CashWalletDB.insert({
        currency,
        amount: -parseFloat(Number(amount).toFixed(2)),
        entryType: "client_transfer_out",
        refId: newId,
        refTable: "ClientTransfers",
        note: `Transfer to client: ${clientName.trim()}`,
        createdAt: nowIso(),
      });
      await refreshClientTransfers();
      await refreshCashWallet();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to save client transfer. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleSave() {
    if (!isValid) return;
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
          New Client Transfer
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || !isValid}
          hitSlop={8}
        >
          <Text
            style={[
              styles.saveBtn,
              { color: isValid && !saving ? colors.primary : colors.mutedForeground },
            ]}
          >
            {saving ? "Saving…" : "Save"}
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
            APPROVAL NOTE PHOTO
          </Text>
          <ImageField ref={imageFieldRef} value={photo} onChange={setPhoto} label="Approval Note Photo" />
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            CLIENT NAME <Text style={{ color: colors.destructive }}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
            ]}
            value={clientName}
            onChangeText={setClientName}
            placeholder="Client's name"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            NAME OF PERSON WHO GAVE MONEY <Text style={{ color: colors.destructive }}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
            ]}
            value={giverName}
            onChangeText={setGiverName}
            placeholder="Giver's name"
            placeholderTextColor={colors.mutedForeground}
          />
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
              { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
            ]}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            CURRENCY
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {CURRENCIES.map((c) => (
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
                  <Text
                    style={[
                      styles.chipText,
                      { color: currency === c ? colors.primaryForeground : colors.foreground },
                    ]}
                  >
                    {c}
                  </Text>
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
});
