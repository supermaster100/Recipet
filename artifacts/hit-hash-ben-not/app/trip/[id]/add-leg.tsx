import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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

import { TravelDB } from "@/db/database";
import { CURRENCIES } from "@/db/types";
import { useColors } from "@/hooks/useColors";
import { saveDraft, loadDraft, clearDraft } from "@/db/draftManager";

const DRAFT_KEY = "add-travel" as const;
const DRAFT_SAVE_INTERVAL_MS = 30_000;

interface TravelDraft {
  legId: string;
  departure: string;
  departureDate: string;
  departureHour: string;
  departureCountry: string;
  departureCity: string;
  arrival: string;
  returnDate: string;
  arrivalHour: string;
  arrivalCountry: string;
  arrivalCity: string;
  placeOfStaying: string;
  nights: string;
  ratePerNight: string;
  currencyPN: string;
}

function today() {
  return new Date().toISOString().split("T")[0] ?? "";
}

export default function AddTravelSegmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const [departure, setDeparture] = useState("");
  const [departureDate, setDepartureDate] = useState(today());
  const [departureHour, setDepartureHour] = useState("08:00");
  const [departureCountry, setDepartureCountry] = useState("");
  const [departureCity, setDepartureCity] = useState("");
  const [arrival, setArrival] = useState("");
  const [returnDate, setReturnDate] = useState(today());
  const [arrivalHour, setArrivalHour] = useState("10:00");
  const [arrivalCountry, setArrivalCountry] = useState("");
  const [arrivalCity, setArrivalCity] = useState("");
  const [placeOfStaying, setPlaceOfStaying] = useState("");
  const [nights, setNights] = useState("0");
  const [ratePerNight, setRatePerNight] = useState("0");
  const [currencyPN, setCurrencyPN] = useState<(typeof CURRENCIES)[number]>("USD");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  function markDirty() {
    if (!dirty) setDirty(true);
  }

  const getDraftData = useCallback((): TravelDraft => ({
    legId: id ?? "",
    departure,
    departureDate,
    departureHour,
    departureCountry,
    departureCity,
    arrival,
    returnDate,
    arrivalHour,
    arrivalCountry,
    arrivalCity,
    placeOfStaying,
    nights,
    ratePerNight,
    currencyPN,
  }), [id, departure, departureDate, departureHour, departureCountry, departureCity, arrival, returnDate, arrivalHour, arrivalCountry, arrivalCity, placeOfStaying, nights, ratePerNight, currencyPN]);

  useEffect(() => {
    if (!id) return;
    loadDraft<TravelDraft>(DRAFT_KEY).then((draft) => {
      if (!draft || draft.legId !== id) return;
      Alert.alert(
        "Resume Entry?",
        "You have an unsaved travel segment. Would you like to resume it?",
        [
          { text: "Discard", style: "destructive", onPress: () => clearDraft(DRAFT_KEY) },
          {
            text: "Resume",
            onPress: () => {
              setDeparture(draft.departure ?? "");
              setDepartureDate(draft.departureDate ?? today());
              setDepartureHour(draft.departureHour ?? "08:00");
              setDepartureCountry(draft.departureCountry ?? "");
              setDepartureCity(draft.departureCity ?? "");
              setArrival(draft.arrival ?? "");
              setReturnDate(draft.returnDate ?? today());
              setArrivalHour(draft.arrivalHour ?? "10:00");
              setArrivalCountry(draft.arrivalCountry ?? "");
              setArrivalCity(draft.arrivalCity ?? "");
              setPlaceOfStaying(draft.placeOfStaying ?? "");
              setNights(draft.nights ?? "0");
              setRatePerNight(draft.ratePerNight ?? "0");
              setCurrencyPN((draft.currencyPN as (typeof CURRENCIES)[number]) ?? "USD");
              setDirty(true);
            },
          },
        ]
      );
    });
  }, [id]);

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
  }, [dirty, getDraftData, departure, departureDate, departureHour, departureCountry, departureCity, arrival, returnDate, arrivalHour, arrivalCountry, arrivalCity, placeOfStaying, nights, ratePerNight, currencyPN]);

  async function handleSave() {
    if (!id) return;
    setSaving(true);
    try {
      await TravelDB.insert({
        lId: Number(id),
        num: 1,
        departure,
        departureDate,
        departureHour,
        departureCountry,
        departureCity,
        arrival,
        returnDate,
        arrivalHour,
        arrivalCountry,
        arrivalCity,
        budget: 0,
        placeOfStaying,
        nights: Number(nights) || 0,
        arbitraryLocation: "",
        ratePerNight: Number(ratePerNight) || 0,
        currencyPN,
        breakfast: false,
        paymentMethod: "",
        hotelExtraFees: 0,
        currencyHEF: "USD",
        description: "",
        photo: null,
        photo_checksum: null,
        export: false,
        deleted_at: null,
      });
      await clearDraft(DRAFT_KEY);
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
          Add Travel Segment
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} hitSlop={8}>
          <Text style={[styles.saveBtn, { color: colors.primary }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DEPARTURE</Text>
        <Input colors={colors} value={departure} onChange={(v) => { setDeparture(v); markDirty(); }} placeholder="Airport/Station" />
        <Input colors={colors} value={departureDate} onChange={(v) => { setDepartureDate(v); markDirty(); }} placeholder="Date (YYYY-MM-DD)" />
        <Input colors={colors} value={departureHour} onChange={(v) => { setDepartureHour(v); markDirty(); }} placeholder="Hour (HH:MM)" />
        <Input colors={colors} value={departureCity} onChange={(v) => { setDepartureCity(v); markDirty(); }} placeholder="City" />
        <Input colors={colors} value={departureCountry} onChange={(v) => { setDepartureCountry(v); markDirty(); }} placeholder="Country" />

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>ARRIVAL</Text>
        <Input colors={colors} value={arrival} onChange={(v) => { setArrival(v); markDirty(); }} placeholder="Airport/Station" />
        <Input colors={colors} value={returnDate} onChange={(v) => { setReturnDate(v); markDirty(); }} placeholder="Date (YYYY-MM-DD)" />
        <Input colors={colors} value={arrivalHour} onChange={(v) => { setArrivalHour(v); markDirty(); }} placeholder="Hour (HH:MM)" />
        <Input colors={colors} value={arrivalCity} onChange={(v) => { setArrivalCity(v); markDirty(); }} placeholder="City" />
        <Input colors={colors} value={arrivalCountry} onChange={(v) => { setArrivalCountry(v); markDirty(); }} placeholder="Country" />

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>ACCOMMODATION</Text>
        <Input colors={colors} value={placeOfStaying} onChange={(v) => { setPlaceOfStaying(v); markDirty(); }} placeholder="Hotel / Place of Staying" />
        <Input colors={colors} value={nights} onChange={(v) => { setNights(v); markDirty(); }} placeholder="Nights" keyboardType="number-pad" />
        <Input colors={colors} value={ratePerNight} onChange={(v) => { setRatePerNight(v); markDirty(); }} placeholder="Rate per Night" keyboardType="decimal-pad" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            {CURRENCIES.map((c) => (
              <Pressable
                key={c}
                onPress={() => { setCurrencyPN(c); markDirty(); }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: currencyPN === c ? colors.primary : colors.card,
                    borderColor: currencyPN === c ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: currencyPN === c ? colors.primaryForeground : colors.foreground }]}>
                  {c}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}

function Input({
  colors,
  value,
  onChange,
  placeholder,
  keyboardType = "default",
}: {
  colors: ReturnType<typeof useColors>;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  keyboardType?: "default" | "number-pad" | "decimal-pad";
}) {
  return (
    <TextInput
      style={[
        styles.input,
        {
          color: colors.foreground,
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={colors.mutedForeground}
      keyboardType={keyboardType}
    />
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
  form: { padding: 16, gap: 10 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8 },
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
});
