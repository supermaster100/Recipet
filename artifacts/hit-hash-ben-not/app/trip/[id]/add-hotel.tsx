import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
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

import { HotelDB } from "@/db/database";
import { CURRENCIES } from "@/db/types";
import { useColors } from "@/hooks/useColors";

function today() { return new Date().toISOString().split("T")[0] ?? ""; }

export default function AddHotelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const [checkIn, setCheckIn] = useState(today());
  const [checkOut, setCheckOut] = useState(today());
  const [hotelName, setHotelName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [pricePerNight, setPricePerNight] = useState("");
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>("USD");
  const [saving, setSaving] = useState(false);

  function calcNights() {
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(diff, 1);
  }

  async function handleSave() {
    if (!id || !pricePerNight) return;
    setSaving(true);
    try {
      const nights = calcNights();
      await HotelDB.insert({
        travelId: Number(id),
        checkIn,
        checkOut,
        hotelName,
        city,
        country,
        pricePerNight: Number(pricePerNight),
        currency,
        nights,
      });
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
      <View style={[styles.header, { paddingTop: topInset + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Add Hotel</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving || !pricePerNight} hitSlop={8}>
          <Text style={[styles.saveBtn, { color: !pricePerNight ? colors.mutedForeground : colors.primary }]}>Save</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">
        {[
          { label: "Hotel Name", value: hotelName, setter: setHotelName, placeholder: "e.g. Hilton NYC" },
          { label: "City", value: city, setter: setCity, placeholder: "e.g. New York" },
          { label: "Country", value: country, setter: setCountry, placeholder: "e.g. USA" },
          { label: "Check In", value: checkIn, setter: setCheckIn, placeholder: "YYYY-MM-DD" },
          { label: "Check Out", value: checkOut, setter: setCheckOut, placeholder: "YYYY-MM-DD" },
          { label: "Price Per Night", value: pricePerNight, setter: setPricePerNight, placeholder: "0.00", numeric: true },
        ].map((f) => (
          <View key={f.label} style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{f.label.toUpperCase()}</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
              value={f.value}
              onChangeText={f.setter}
              placeholder={f.placeholder}
              placeholderTextColor={colors.mutedForeground}
              keyboardType={f.numeric ? "decimal-pad" : "default"}
            />
          </View>
        ))}
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
        <View style={[styles.nightsBadge, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "33" }]}>
          <Text style={[styles.nightsText, { color: colors.primary }]}>{calcNights()} night{calcNights() !== 1 ? "s" : ""}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  saveBtn: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  form: { padding: 16, gap: 12 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium", letterSpacing: 0.3 },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  chipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  nightsBadge: { borderRadius: 10, borderWidth: 1, padding: 12, alignItems: "center" },
  nightsText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
