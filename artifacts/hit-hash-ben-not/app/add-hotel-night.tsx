import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ImageField, ImageFieldHandle } from "@/components/ui/ImageField";
import { TravelDB } from "@/db/database";
import { CURRENCIES } from "@/db/types";
import { useColors } from "@/hooks/useColors";

const PAYMENT_METHODS = ["Credit Card", "Cash"];

function today() {
  return new Date().toISOString().split("T")[0] ?? "";
}

export default function AddHotelNightScreen() {
  const { legId } = useLocalSearchParams<{ legId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const imageRef = useRef<ImageFieldHandle>(null);

  const [nights, setNights] = useState("1");
  const [ratePerNight, setRatePerNight] = useState("");
  const [currencyPN, setCurrencyPN] = useState<(typeof CURRENCIES)[number]>("USD");
  const [breakfast, setBreakfast] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [hotelExtraFees, setHotelExtraFees] = useState("");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!legId) return;
    setSaving(true);
    try {
      await TravelDB.insert({
        lId: Number(legId),
        num: 1,
        departure: "",
        departureDate: today(),
        departureHour: "",
        departureCountry: "",
        departureCity: "",
        arrival: "",
        returnDate: today(),
        arrivalHour: "",
        arrivalCountry: "",
        arrivalCity: "",
        budget: 0,
        placeOfStaying: "",
        nights: Number(nights) || 0,
        arbitraryLocation: "",
        ratePerNight: Number(ratePerNight) || 0,
        currencyPN,
        breakfast,
        paymentMethod,
        hotelExtraFees: Number(hotelExtraFees) || 0,
        currencyHEF: currencyPN,
        description: note,
        photo: photo ?? null,
        export: false,
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
      <View
        style={[
          styles.header,
          { paddingTop: topInset + 8, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Add Hotel Night</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} hitSlop={8}>
          <Text style={[styles.saveBtn, { color: saving ? colors.mutedForeground : colors.primary }]}>
            {saving ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        <FormField label="Nights *">
          <TextInput
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
            value={nights}
            onChangeText={setNights}
            placeholder="1"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="number-pad"
          />
        </FormField>

        <FormField label="Rate / Night">
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.flex1, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
              value={ratePerNight}
              onChangeText={setRatePerNight}
              placeholder="0.00"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="decimal-pad"
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.currencyScroll}>
              <View style={styles.chipRow}>
                {CURRENCIES.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setCurrencyPN(c)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: currencyPN === c ? colors.primary : colors.card,
                        borderColor: currencyPN === c ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: currencyPN === c ? colors.primaryForeground : colors.foreground },
                      ]}
                    >
                      {c}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        </FormField>

        <FormField label="Breakfast">
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: colors.foreground }]}>
              {breakfast ? "Included" : "Not included"}
            </Text>
            <Switch
              value={breakfast}
              onValueChange={setBreakfast}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFF"
            />
          </View>
        </FormField>

        <FormField label="Payment">
          <View style={styles.chipRow}>
            {PAYMENT_METHODS.map((pm) => (
              <Pressable
                key={pm}
                onPress={() => setPaymentMethod(pm)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: paymentMethod === pm ? colors.primary : colors.card,
                    borderColor: paymentMethod === pm ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: paymentMethod === pm ? colors.primaryForeground : colors.foreground },
                  ]}
                >
                  {pm}
                </Text>
              </Pressable>
            ))}
          </View>
        </FormField>

        <FormField label="Extra Fees">
          <TextInput
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
            value={hotelExtraFees}
            onChangeText={setHotelExtraFees}
            placeholder="0.00 (optional)"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
          />
        </FormField>

        <FormField label="Note">
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
            ]}
            value={note}
            onChangeText={setNote}
            placeholder="Optional note..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
          />
        </FormField>

        <FormField label="Photo">
          <ImageField
            ref={imageRef}
            value={photo ?? ""}
            onChange={(v) => setPhoto(v || null)}
            label="Hotel Photo"
          />
        </FormField>
      </ScrollView>
    </View>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label.toUpperCase()}</Text>
      {children}
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
  field: { gap: 8 },
  fieldLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.6 },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  textArea: { height: 80, textAlignVertical: "top" },
  flex1: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  currencyScroll: { flexShrink: 1 },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  chipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  switchLabel: { fontSize: 15, fontFamily: "Inter_400Regular" },
});
