import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
import { CURRENCIES, type Travel } from "@/db/types";
import { useColors } from "@/hooks/useColors";
import { deletePhotoFromLocal } from "@/utils/photoUtils";

const PAYMENT_METHODS = ["Credit Card", "Cash"];

export default function EditHotelNightScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const imageRef = useRef<ImageFieldHandle>(null);

  const [travel, setTravel] = useState<Travel | null>(null);
  const [nights, setNights] = useState("1");
  const [arbitraryLocation, setArbitraryLocation] = useState(false);
  const [ratePerNight, setRatePerNight] = useState("");
  const [currencyPN, setCurrencyPN] = useState<(typeof CURRENCIES)[number]>("USD");
  const [breakfast, setBreakfast] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [hotelExtraFees, setHotelExtraFees] = useState("");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    TravelDB.getById(Number(id)).then((t) => {
      if (!t) return;
      setTravel(t);
      setNights(String(t.nights || 1));
      setArbitraryLocation(!!t.arbitraryLocation);
      setRatePerNight(t.ratePerNight > 0 ? String(t.ratePerNight) : "");
      setCurrencyPN(t.currencyPN);
      setBreakfast(t.breakfast);
      setPaymentMethod(t.paymentMethod || "Credit Card");
      setHotelExtraFees(t.hotelExtraFees > 0 ? String(t.hotelExtraFees) : "");
      setNote(t.description || "");
      setPhoto(t.photo ?? null);
    });
  }, [id]);

  async function handleSave() {
    if (!travel) return;
    const nightsNum = Number(nights);
    if (!nights.trim() || isNaN(nightsNum) || nightsNum < 1) {
      Alert.alert("Required", "Please enter a valid number of nights (minimum 1).");
      return;
    }
    if (!arbitraryLocation) {
      const rateNum = Number(ratePerNight);
      if (!ratePerNight.trim() || isNaN(rateNum) || rateNum <= 0) {
        Alert.alert("Required", "Please enter a rate per night greater than 0, or enable Arbitrary Location.");
        return;
      }
    }
    setSaving(true);
    try {
      await TravelDB.update({
        ...travel,
        nights: nightsNum,
        arbitraryLocation: arbitraryLocation ? "true" : "",
        ratePerNight: arbitraryLocation ? 0 : Number(ratePerNight) || 0,
        currencyPN,
        breakfast: arbitraryLocation ? false : breakfast,
        paymentMethod: arbitraryLocation ? "" : paymentMethod,
        hotelExtraFees: arbitraryLocation ? 0 : Number(hotelExtraFees) || 0,
        description: note,
        photo: photo ?? null,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    if (!travel) return;
    Alert.alert("Delete Hotel Night", "Delete this hotel night record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (travel.photo) await deletePhotoFromLocal(travel.photo);
          await TravelDB.delete(travel.id);
          router.back();
        },
      },
    ]);
  }

  if (!travel) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topInset + 8, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Hotel Night</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loading}>
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading...</Text>
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
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Edit Hotel Night</Text>
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

        <FormField label="Arbitrary Location">
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: arbitraryLocation ? colors.foreground : colors.mutedForeground }]}>
              {arbitraryLocation ? "Enabled — hotel rate fields disabled" : "Disabled"}
            </Text>
            <Switch
              value={arbitraryLocation}
              onValueChange={(v) => {
                setArbitraryLocation(v);
                if (v) {
                  setRatePerNight("");
                  setBreakfast(false);
                  setPaymentMethod("Credit Card");
                  setHotelExtraFees("");
                }
              }}
              trackColor={{ false: colors.border, true: colors.warning }}
              thumbColor="#FFF"
            />
          </View>
        </FormField>

        <FormField label="Rate / Night">
          <View style={[styles.row, arbitraryLocation && styles.disabledSection]}>
            <TextInput
              style={[styles.input, styles.flex1, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }, arbitraryLocation && { opacity: 0.4 }]}
              value={ratePerNight}
              onChangeText={setRatePerNight}
              placeholder="0.00"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="decimal-pad"
              editable={!arbitraryLocation}
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
          <View style={[styles.switchRow, arbitraryLocation && { opacity: 0.4 }]}>
            <Text style={[styles.switchLabel, { color: colors.foreground }]}>
              {breakfast ? "Included" : "Not included"}
            </Text>
            <Switch
              value={breakfast}
              onValueChange={arbitraryLocation ? undefined : setBreakfast}
              disabled={arbitraryLocation}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFF"
            />
          </View>
        </FormField>

        <FormField label="Payment">
          <View style={[styles.chipRow, arbitraryLocation && { opacity: 0.4 }]}>
            {PAYMENT_METHODS.map((pm) => (
              <Pressable
                key={pm}
                onPress={arbitraryLocation ? undefined : () => setPaymentMethod(pm)}
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
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }, arbitraryLocation && { opacity: 0.4 }]}
            value={hotelExtraFees}
            onChangeText={setHotelExtraFees}
            placeholder="0.00 (optional)"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
            editable={!arbitraryLocation}
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

        <TouchableOpacity
          onPress={handleDelete}
          style={[styles.deleteBtn, { borderColor: colors.destructive }]}
        >
          <Feather name="trash-2" size={16} color={colors.destructive} />
          <Text style={[styles.deleteBtnText, { color: colors.destructive }]}>
            Delete Hotel Night
          </Text>
        </TouchableOpacity>
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
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontSize: 15, fontFamily: "Inter_400Regular" },
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
  disabledSection: { opacity: 0.4 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  chipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  switchLabel: { fontSize: 15, fontFamily: "Inter_400Regular" },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 8,
  },
  deleteBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
