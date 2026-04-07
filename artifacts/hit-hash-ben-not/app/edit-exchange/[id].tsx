import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
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

import { ImageField } from "@/components/ui/ImageField";
import { deletePhotoFromLocal } from "@/utils/photoUtils";
import { useAppContext } from "@/context/AppContext";
import { ExchangeDB } from "@/db/database";
import { CURRENCIES } from "@/db/types";
import { useColors } from "@/hooks/useColors";

export default function EditExchangeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { exchanges, refreshExchanges } = useAppContext();

  const exchange = exchanges.find((e) => e.id === Number(id));
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const [date, setDate] = useState(exchange?.date ?? "");
  const [spentCurrency, setSpentCurrency] = useState<(typeof CURRENCIES)[number]>(
    (exchange?.spentCurrency as (typeof CURRENCIES)[number]) ?? "USD"
  );
  const [receivedCurrency, setReceivedCurrency] = useState<(typeof CURRENCIES)[number]>(
    (exchange?.receivedCurrency as (typeof CURRENCIES)[number]) ?? "ILS"
  );
  const [amountSpent, setAmountSpent] = useState(exchange ? String(exchange.amountSpent) : "");
  const [amountReceived, setAmountReceived] = useState(exchange ? String(exchange.amountReceived) : "");
  const [note, setNote] = useState(exchange?.note ?? "");
  const [photo, setPhoto] = useState(exchange?.photo ?? "");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  function markDirty() {
    if (!dirty) setDirty(true);
  }

  const confirmDiscard = useCallback(
    () =>
      new Promise<boolean>((resolve) => {
        Alert.alert(
          "Discard changes?",
          "You have unsaved changes. Are you sure you want to go back?",
          [
            { text: "Keep Editing", style: "cancel", onPress: () => resolve(false) },
            { text: "Discard", style: "destructive", onPress: () => resolve(true) },
          ]
        );
      }),
    []
  );

  useEffect(() => {
    if (!dirty) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      confirmDiscard().then((ok) => { if (ok) router.back(); });
      return true;
    });
    return () => sub.remove();
  }, [dirty, confirmDiscard]);

  useEffect(() => {
    if (!dirty) return;
    type BeforeRemoveEvent = { preventDefault: () => void; data: { action: Parameters<typeof navigation.dispatch>[0] } };
    const unsubscribe = navigation.addListener("beforeRemove" as never, (e: BeforeRemoveEvent) => {
      e.preventDefault();
      confirmDiscard().then((ok) => { if (ok) navigation.dispatch(e.data.action); });
    });
    return unsubscribe;
  }, [dirty, navigation, confirmDiscard]);

  function handleBack() {
    if (dirty) {
      confirmDiscard().then((ok) => { if (ok) router.back(); });
    } else {
      router.back();
    }
  }

  async function handleSave() {
    if (!exchange || !amountSpent || !amountReceived) return;
    setSaving(true);
    try {
      await ExchangeDB.update({
        ...exchange,
        date,
        amountSpent: Number(amountSpent),
        spentCurrency,
        amountReceived: Number(amountReceived),
        receivedCurrency,
        note,
        photo: photo || null,
      });
      await refreshExchanges();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDirty(false);
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!exchange) return;
    Alert.alert("Delete Exchange", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await ExchangeDB.softDelete(exchange.id);
          await refreshExchanges();
          router.back();
        },
      },
    ]);
  }

  if (!exchange) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topInset + 8, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Exchange</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.notFound}>
          <Feather name="alert-circle" size={40} color={colors.mutedForeground} />
          <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>Exchange not found</Text>
        </View>
      </View>
    );
  }

  const canSave = !!amountSpent && !!amountReceived;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleBack} hitSlop={8}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Edit Exchange</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleDelete} hitSlop={8}>
            <Feather name="trash-2" size={20} color={colors.destructive} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!canSave || saving}
            style={[
              styles.saveBtn,
              { backgroundColor: canSave && !saving ? colors.primary : colors.primary + "50" },
            ]}
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
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>DATE</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
            value={date}
            onChangeText={(v) => { setDate(v); markDirty(); }}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>SPENT CURRENCY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {CURRENCIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => { setSpentCurrency(c); markDirty(); }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: spentCurrency === c ? colors.primary : colors.card,
                      borderColor: spentCurrency === c ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: spentCurrency === c ? colors.primaryForeground : colors.foreground }]}>{c}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>RECEIVED CURRENCY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {CURRENCIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => { setReceivedCurrency(c); markDirty(); }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: receivedCurrency === c ? colors.primary : colors.card,
                      borderColor: receivedCurrency === c ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: receivedCurrency === c ? colors.primaryForeground : colors.foreground }]}>{c}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>AMOUNT SPENT ({spentCurrency})</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
            value={amountSpent}
            onChangeText={(v) => { setAmountSpent(v); markDirty(); }}
            placeholder="0.00"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>AMOUNT RECEIVED ({receivedCurrency})</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
            value={amountReceived}
            onChangeText={(v) => { setAmountReceived(v); markDirty(); }}
            placeholder="0.00"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>NOTE</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
            value={note}
            onChangeText={(v) => { setNote(v); markDirty(); }}
            placeholder="Optional note"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>PHOTO</Text>
          <ImageField value={photo} onChange={(p) => { setPhoto(p); markDirty(); }} />
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
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  chipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontSize: 15, fontFamily: "Inter_400Regular" },
});
