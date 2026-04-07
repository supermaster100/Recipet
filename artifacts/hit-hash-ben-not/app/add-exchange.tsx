import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { ExchangeDB } from "@/db/database";
import { CURRENCIES } from "@/db/types";
import { useColors } from "@/hooks/useColors";
import { saveDraft, loadDraft, clearDraft } from "@/db/draftManager";
import { checkDiskSpace } from "@/db/dataProtection";
import { savePhotoToOrganizedStorage, savePhotoToGallery, computeFileChecksum } from "@/db/photoStorage";
import * as FileSystem from "expo-file-system/legacy";

const DRAFT_KEY = "add-exchange" as const;
const DRAFT_SAVE_INTERVAL_MS = 30_000;

interface ExchangeDraft {
  date: string;
  spentCurrency: string;
  receivedCurrency: string;
  amountSpent: string;
  amountReceived: string;
  note: string;
  photo: string;
}

function today(): string {
  return new Date().toISOString().split("T")[0] ?? "";
}

export default function AddExchangeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { refreshExchanges } = useAppContext();

  const [date, setDate] = useState(today());
  const [spentCurrency, setSpentCurrency] = useState<(typeof CURRENCIES)[number]>("USD");
  const [receivedCurrency, setReceivedCurrency] = useState<(typeof CURRENCIES)[number]>("ILS");
  const [amountSpent, setAmountSpent] = useState("");
  const [amountReceived, setAmountReceived] = useState("");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const imageFieldRef = useRef<ImageFieldHandle>(null);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    loadDraft<ExchangeDraft>(DRAFT_KEY).then((draft) => {
      if (!draft) return;
      Alert.alert(
        "Resume Entry?",
        "You have an unsaved exchange entry. Would you like to resume it?",
        [
          {
            text: "Discard",
            style: "destructive",
            onPress: () => clearDraft(DRAFT_KEY),
          },
          {
            text: "Resume",
            onPress: () => {
              setDate(draft.date);
              setSpentCurrency(draft.spentCurrency as (typeof CURRENCIES)[number]);
              setReceivedCurrency(draft.receivedCurrency as (typeof CURRENCIES)[number]);
              setAmountSpent(draft.amountSpent);
              setAmountReceived(draft.amountReceived);
              setNote(draft.note);
              setPhoto(draft.photo ?? "");
              setDirty(true);
            },
          },
        ]
      );
    });
  }, []);

  const getDraftData = useCallback((): ExchangeDraft => ({
    date,
    spentCurrency,
    receivedCurrency,
    amountSpent,
    amountReceived,
    note,
    photo,
  }), [date, spentCurrency, receivedCurrency, amountSpent, amountReceived, note, photo]);

  useEffect(() => {
    if (!dirty) return;
    const interval = setInterval(() => {
      saveDraft(DRAFT_KEY, getDraftData());
    }, DRAFT_SAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [dirty, getDraftData]);

  useEffect(() => {
    if (dirty) {
      saveDraft(DRAFT_KEY, getDraftData());
    }
  }, [dirty, getDraftData, date, spentCurrency, receivedCurrency, amountSpent, amountReceived, note, photo]);

  function markDirty() {
    if (!dirty) setDirty(true);
  }

  async function doSave(photoPath: string) {
    const hasSpace = await checkDiskSpace();
    if (!hasSpace) return;

    setSaving(true);
    let finalPhotoPath = photoPath || null;
    let photoChecksum: string | null = null;
    let organizedPhotoPath: string | null = null;

    try {
      if (finalPhotoPath && Platform.OS !== "web") {
        const organized = await savePhotoToOrganizedStorage(finalPhotoPath, "EXCHANGE");
        if (organized) {
          organizedPhotoPath = organized;
          await savePhotoToGallery(organized).catch(() => {});
          photoChecksum = await computeFileChecksum(organized).catch(() => null);
          finalPhotoPath = organized;
        }
      }

      await ExchangeDB.insert({
        date,
        amountSpent: Number(amountSpent),
        spentCurrency,
        amountReceived: Number(amountReceived),
        receivedCurrency,
        note,
        photo: finalPhotoPath,
        photo_checksum: photoChecksum,
        status: "",
        export: false,
        deleted_at: null,
      });
      await clearDraft(DRAFT_KEY);
      await refreshExchanges();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      console.error(e);
      if (organizedPhotoPath && Platform.OS !== "web") {
        await FileSystem.deleteAsync(organizedPhotoPath, { idempotent: true }).catch(() => {});
      }
      Alert.alert("Error", "Failed to save exchange. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleSave() {
    if (!amountSpent || !amountReceived) return;
    if (!photo.trim()) {
      if (Platform.OS === "web") {
        const confirmed = window.confirm(
          "No receipt photo. Save without photo?"
        );
        if (confirmed) {
          doSave("");
        }
        return;
      }
      Alert.alert(
        "No Receipt Photo",
        "Do you want to add a photo of the exchange receipt?",
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
          New Exchange
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || !amountSpent || !amountReceived}
          hitSlop={8}
        >
          <Text
            style={[
              styles.saveBtn,
              {
                color:
                  !amountSpent || !amountReceived
                    ? colors.mutedForeground
                    : colors.primary,
              },
            ]}
          >
            Save
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
            DATE
          </Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
            ]}
            value={date}
            onChangeText={(v) => { setDate(v); markDirty(); }}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            SPENT CURRENCY
          </Text>
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
                  <Text
                    style={[
                      styles.chipText,
                      { color: spentCurrency === c ? colors.primaryForeground : colors.foreground },
                    ]}
                  >
                    {c}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            RECEIVED CURRENCY
          </Text>
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
                  <Text
                    style={[
                      styles.chipText,
                      { color: receivedCurrency === c ? colors.primaryForeground : colors.foreground },
                    ]}
                  >
                    {c}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            AMOUNT SPENT ({spentCurrency})
          </Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
            ]}
            value={amountSpent}
            onChangeText={(v) => { setAmountSpent(v); markDirty(); }}
            placeholder="0.00"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            AMOUNT RECEIVED ({receivedCurrency})
          </Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
            ]}
            value={amountReceived}
            onChangeText={(v) => { setAmountReceived(v); markDirty(); }}
            placeholder="0.00"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            NOTE
          </Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
            ]}
            value={note}
            onChangeText={(v) => { setNote(v); markDirty(); }}
            placeholder="Optional note"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            PHOTO
          </Text>
          <ImageField ref={imageFieldRef} value={photo} onChange={(p) => { setPhoto(p); markDirty(); }} />
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
