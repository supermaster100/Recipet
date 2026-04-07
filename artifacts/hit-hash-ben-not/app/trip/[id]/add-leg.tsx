import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LegDB } from "@/db/database";
import { useColors } from "@/hooks/useColors";

function today() { return new Date().toISOString().split("T")[0] ?? ""; }

const TRANSPORTS = ["Flight", "Train", "Bus", "Car", "Taxi", "Boat", "Other"];

export default function AddLegScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const [departureDate, setDepartureDate] = useState(today());
  const [departureHour, setDepartureHour] = useState("08:00");
  const [departureCountry, setDepartureCountry] = useState("");
  const [departureCity, setDepartureCity] = useState("");
  const [arrivalDate, setArrivalDate] = useState(today());
  const [arrivalHour, setArrivalHour] = useState("10:00");
  const [arrivalCountry, setArrivalCountry] = useState("");
  const [arrivalCity, setArrivalCity] = useState("");
  const [transport, setTransport] = useState("Flight");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!id) return;
    setSaving(true);
    try {
      await LegDB.insert({
        travelId: Number(id),
        departureDate,
        departureHour,
        departureCountry,
        departureCity,
        arrivalDate,
        arrivalHour,
        arrivalCountry,
        arrivalCity,
        transport,
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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Add Leg</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} hitSlop={8}>
          <Text style={[styles.saveBtn, { color: colors.primary }]}>Save</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>DEPARTURE</Text>
        {[
          { label: "Date", value: departureDate, setter: setDepartureDate, placeholder: "YYYY-MM-DD" },
          { label: "Hour", value: departureHour, setter: setDepartureHour, placeholder: "HH:MM" },
          { label: "Country", value: departureCountry, setter: setDepartureCountry, placeholder: "e.g. Israel" },
          { label: "City", value: departureCity, setter: setDepartureCity, placeholder: "e.g. Tel Aviv" },
        ].map((f) => (
          <View key={f.label} style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{f.label.toUpperCase()}</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
              value={f.value}
              onChangeText={f.setter}
              placeholder={f.placeholder}
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
        ))}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 8 }]}>ARRIVAL</Text>
        {[
          { label: "Date", value: arrivalDate, setter: setArrivalDate, placeholder: "YYYY-MM-DD" },
          { label: "Hour", value: arrivalHour, setter: setArrivalHour, placeholder: "HH:MM" },
          { label: "Country", value: arrivalCountry, setter: setArrivalCountry, placeholder: "e.g. USA" },
          { label: "City", value: arrivalCity, setter: setArrivalCity, placeholder: "e.g. New York" },
        ].map((f) => (
          <View key={f.label} style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{f.label.toUpperCase()}</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
              value={f.value}
              onChangeText={f.setter}
              placeholder={f.placeholder}
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
        ))}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 8 }]}>TRANSPORT</Text>
        <View style={styles.chipRow}>
          {TRANSPORTS.map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTransport(t)}
              style={[styles.chip, { backgroundColor: transport === t ? colors.primary : colors.card, borderColor: transport === t ? colors.primary : colors.border }]}
            >
              <Text style={[styles.chipText, { color: transport === t ? colors.primaryForeground : colors.foreground }]}>{t}</Text>
            </TouchableOpacity>
          ))}
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
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium", letterSpacing: 0.3 },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
});
