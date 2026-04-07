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
import { ATMDB } from "@/db/database";
import { EXCHANGE_CURRENCIES } from "@/db/types";
import { useColors } from "@/hooks/useColors";

function today(): string {
  return new Date().toISOString().split("T")[0] ?? "";
}

export default function AddATMScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { refreshATM } = useAppContext();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const imageFieldRef = useRef<ImageFieldHandle>(null);

  const [date, setDate] = useState(today());
  const [cardLastFour, setCardLastFour] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<(typeof EXCHANGE_CURRENCIES)[number]>("USD");
  const [photo, setPhoto] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = !!date && cardLastFour.length === 4 && !!amount && !saving;

  async function doSave(photoPath: string) {
    setSaving(true);
    try {
      await ATMDB.insert({
        date,
        cardLastFour,
        amount: Number(amount),
        currency,
        photo: photoPath || null,
        createdAt: new Date().toISOString(),
      });
      await refreshATM();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>ATM Withdrawal</Text>
        <TouchableOpacity onPress={handleSave} disabled={!canSave} hitSlop={8}>
          <Text style={[styles.saveBtn, { color: canSave ? colors.primary : colors.mutedForeground }]}>
            {saving ? "Saving…" : "Save"}
          </Text>
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

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="info" size={14} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            ATM withdrawal amount will be credited to your cash wallet for {currency}.
          </Text>
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
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  chipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
});
