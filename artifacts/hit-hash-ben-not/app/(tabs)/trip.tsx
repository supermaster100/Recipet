import { Feather } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
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

import { LegDB, TravelDB } from "@/db/database";
import type { Leg, Travel } from "@/db/types";
import { useColors } from "@/hooks/useColors";
import { getCities, getCountries } from "@/utils/countriesData";
import { deletePhotoFromLocal } from "@/utils/photoUtils";

const COUNTRIES = getCountries();

function today() {
  return new Date().toISOString().split("T")[0] ?? "";
}

function parseDate(s: string): Date {
  const parts = s.split("-").map(Number);
  if (parts.length === 3 && parts.every((n) => !isNaN(n))) {
    return new Date(parts[0]!, parts[1]! - 1, parts[2]!);
  }
  return new Date();
}

function parseTime(s: string): Date {
  const d = new Date();
  const parts = s.split(":").map(Number);
  if (parts.length >= 2 && parts.every((n) => !isNaN(n))) {
    d.setHours(parts[0]!, parts[1]!, 0, 0);
  }
  return d;
}

function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function emptyLeg(): Omit<Leg, "id"> {
  return {
    type: "TRIP",
    status: "active",
    departureDate: today(),
    departureHour: "08:00",
    departureCountry: "",
    departureCity: "",
    arrivalDate: today(),
    arrivalHour: "10:00",
    arrivalCountry: "",
    arrivalCity: "",
  };
}

function CountryPickerModal({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: string;
  onSelect: (code: string) => void;
  onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  if (!visible) return null;

  const filtered = query.trim()
    ? COUNTRIES.filter(
        (c) =>
          c.code.toLowerCase().includes(query.toLowerCase()) ||
          c.name.toLowerCase().includes(query.toLowerCase())
      )
    : COUNTRIES;

  return (
    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.background, zIndex: 100 }]}>
      <View
        style={[
          styles.pickerHeader,
          { paddingTop: (Platform.OS === "web" ? 67 : insets.top) + 8, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={() => { onClose(); setQuery(""); }} hitSlop={8}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.pickerTitle, { color: colors.foreground }]}>Select Country</Text>
        <View style={{ width: 22 }} />
      </View>
      <View style={[styles.pickerSearch, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.pickerSearchInput, { color: colors.foreground }]}
          value={query}
          onChangeText={setQuery}
          placeholder="Search..."
          placeholderTextColor={colors.mutedForeground}
          autoFocus
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Feather name="x-circle" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.code}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              onSelect(item.code);
              onClose();
              setQuery("");
            }}
            style={[
              styles.pickerOption,
              { backgroundColor: item.code === selected ? colors.primary + "22" : "transparent" },
            ]}
          >
            <Text style={[styles.pickerOptionCode, { color: colors.mutedForeground }]}>{item.code}</Text>
            <Text
              style={[
                styles.pickerOptionName,
                { color: item.code === selected ? colors.primary : colors.foreground },
              ]}
            >
              {item.name}
            </Text>
            {item.code === selected && <Feather name="check" size={16} color={colors.primary} />}
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      />
    </View>
  );
}

function CityPickerModal({
  visible,
  countryCode,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  countryCode: string;
  selected: string;
  onSelect: (code: string) => void;
  onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const cities = getCities(countryCode);

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.background, zIndex: 100 }]}>
      <View
        style={[
          styles.pickerHeader,
          { paddingTop: (Platform.OS === "web" ? 67 : insets.top) + 8, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={onClose} hitSlop={8}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.pickerTitle, { color: colors.foreground }]}>Select City</Text>
        <View style={{ width: 22 }} />
      </View>
      {cities.length === 0 ? (
        <View style={styles.pickerEmpty}>
          <Text style={[styles.pickerEmptyText, { color: colors.mutedForeground }]}>
            No cities available for this country
          </Text>
          <TouchableOpacity
            onPress={() => { onSelect(""); onClose(); }}
            style={[styles.smallBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.smallBtnText}>OK</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={cities}
          keyExtractor={(item) => item.code}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => { onSelect(item.code); onClose(); }}
              style={[
                styles.pickerOption,
                { backgroundColor: item.code === selected ? colors.primary + "22" : "transparent" },
              ]}
            >
              <Text
                style={[
                  styles.pickerOptionName,
                  { color: item.code === selected ? colors.primary : colors.foreground },
                ]}
              >
                {item.name}
              </Text>
              {item.code === selected && <Feather name="check" size={16} color={colors.primary} />}
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        />
      )}
    </View>
  );
}

function HotelRow({
  travel,
  isSelected,
  onToggle,
  onPress,
}: {
  travel: Travel;
  isSelected: boolean;
  onToggle: () => void;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.hotelRow, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <TouchableOpacity onPress={onToggle} hitSlop={8}>
        <View
          style={[
            styles.checkboxBox,
            {
              borderColor: isSelected ? colors.primary : colors.border,
              backgroundColor: isSelected ? colors.primary : "transparent",
            },
          ]}
        >
          {isSelected && <Feather name="check" size={12} color="#FFF" />}
        </View>
      </TouchableOpacity>
      <View style={styles.hotelRowContent}>
        <View style={styles.hotelRowMain}>
          <Text style={[styles.hotelRate, { color: colors.foreground }]}>
            {travel.ratePerNight > 0
              ? `${travel.ratePerNight} ${travel.currencyPN}/night`
              : "\u2014"}
          </Text>
          {travel.nights > 0 && (
            <Text style={[styles.hotelNights, { color: colors.mutedForeground }]}>
              {" "}&middot;{" "}{travel.nights} night{travel.nights !== 1 ? "s" : ""}
            </Text>
          )}
        </View>
        {travel.description ? (
          <Text style={[styles.hotelNote, { color: colors.mutedForeground }]} numberOfLines={1}>
            {travel.description}
          </Text>
        ) : null}
      </View>
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.fieldRow}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={styles.fieldValue}>{children}</View>
    </View>
  );
}

export default function TripScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const [legData, setLegData] = useState<Omit<Leg, "id">>(emptyLeg());
  const [legId, setLegId] = useState<number | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const [hotels, setHotels] = useState<Travel[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [showDepCountry, setShowDepCountry] = useState(false);
  const [showDepCity, setShowDepCity] = useState(false);
  const [showArrCountry, setShowArrCountry] = useState(false);
  const [showArrCity, setShowArrCity] = useState(false);

  const [showDepDate, setShowDepDate] = useState(false);
  const [showDepTime, setShowDepTime] = useState(false);
  const [showArrDate, setShowArrDate] = useState(false);
  const [showArrTime, setShowArrTime] = useState(false);

  async function load() {
    const leg = await LegDB.getFirst();
    if (leg) {
      setLegId(leg.id);
      setLegData({
        type: leg.type,
        status: leg.status,
        departureDate: leg.departureDate,
        departureHour: leg.departureHour,
        departureCountry: leg.departureCountry,
        departureCity: leg.departureCity,
        arrivalDate: leg.arrivalDate,
        arrivalHour: leg.arrivalHour,
        arrivalCountry: leg.arrivalCountry,
        arrivalCity: leg.arrivalCity,
      });
      const travels = await TravelDB.getByLegId(leg.id);
      setHotels(travels);
    } else {
      setLegData(emptyLeg());
      setLegId(null);
      setHotels([]);
    }
    setIsDirty(false);
    setSelectedIds(new Set());
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  function update(field: keyof Omit<Leg, "id">, value: string) {
    setLegData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }

  async function handleSave() {
    const missing: string[] = [];
    if (!legData.departureDate.trim()) missing.push("Departure Date");
    if (!legData.departureHour.trim()) missing.push("Departure Hour");
    if (!legData.departureCountry) missing.push("Departure Country");
    if (!legData.departureCity) missing.push("Departure City");
    if (!legData.arrivalDate.trim()) missing.push("Arrival Date");
    if (!legData.arrivalHour.trim()) missing.push("Arrival Hour");
    if (!legData.arrivalCountry) missing.push("Arrival Country");
    if (!legData.arrivalCity) missing.push("Arrival City");
    if (missing.length > 0) {
      Alert.alert("Required Fields", "Please fill in: " + missing.join(", ") + ".");
      return;
    }
    setSaving(true);
    try {
      const saved = await LegDB.upsertSingleton(legData);
      setLegId(saved.id);
      setIsDirty(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  function toggleSelected(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDeleteSelected() {
    if (selectedIds.size === 0) return;
    Alert.alert("Delete Selected", "Delete " + selectedIds.size + " hotel night(s)?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          for (const id of selectedIds) {
            const t = hotels.find((h) => h.id === id);
            if (t?.photo) await deletePhotoFromLocal(t.photo);
            await TravelDB.delete(id);
          }
          setSelectedIds(new Set());
          const updated = legId ? await TravelDB.getByLegId(legId) : [];
          setHotels(updated);
        },
      },
    ]);
  }

  async function handleClear() {
    if (hotels.length === 0) return;
    Alert.alert("Clear All", "Delete all hotel nights?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          for (const t of hotels) {
            if (t.photo) await deletePhotoFromLocal(t.photo);
            await TravelDB.delete(t.id);
          }
          setSelectedIds(new Set());
          setHotels([]);
        },
      },
    ]);
  }

  function handleAddHotel() {
    if (!legId) {
      Alert.alert("Save Trip First", "Please save the trip data before adding hotel nights.");
      return;
    }
    router.push({ pathname: "/add-hotel-night", params: { legId: String(legId) } });
  }

  const depCities = getCities(legData.departureCountry);
  const arrCities = getCities(legData.arrivalCountry);
  const depCountryName = COUNTRIES.find((c) => c.code === legData.departureCountry)?.name ?? "";
  const depCityName = depCities.find((c) => c.code === legData.departureCity)?.name ?? legData.departureCity;
  const arrCountryName = COUNTRIES.find((c) => c.code === legData.arrivalCountry)?.name ?? "";
  const arrCityName = arrCities.find((c) => c.code === legData.arrivalCity)?.name ?? legData.arrivalCity;

  const anyPickerOpen = showDepCountry || showDepCity || showArrCountry || showArrCity;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topInset + 8, borderBottomColor: colors.border },
        ]}
      >
        {isDirty ? (
          <TouchableOpacity onPress={load} hitSlop={8}>
            <Text style={[styles.headerAction, { color: colors.mutedForeground }]}>Cancel</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Trip</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || !isDirty}
          hitSlop={8}
        >
          <Text
            style={[
              styles.headerAction,
              { color: isDirty && !saving ? colors.primary : colors.mutedForeground },
            ]}
          >
            {saving ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Departure</Text>

          <FieldRow label="Date *">
            <TouchableOpacity
              onPress={() => setShowDepDate(true)}
              style={[styles.selectTrigger, { borderColor: colors.border }]}
            >
              <Text style={[styles.selectTriggerText, { color: legData.departureDate ? colors.foreground : colors.mutedForeground }]}>
                {legData.departureDate || "Select date..."}
              </Text>
              <Feather name="calendar" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
            {showDepDate && (
              <DateTimePicker
                value={parseDate(legData.departureDate)}
                mode="date"
                display="default"
                onChange={(_: DateTimePickerEvent, d?: Date) => {
                  setShowDepDate(false);
                  if (d) update("departureDate", fmtDate(d));
                }}
              />
            )}
          </FieldRow>

          <FieldRow label="Hour *">
            <TouchableOpacity
              onPress={() => setShowDepTime(true)}
              style={[styles.selectTrigger, { borderColor: colors.border }]}
            >
              <Text style={[styles.selectTriggerText, { color: legData.departureHour ? colors.foreground : colors.mutedForeground }]}>
                {legData.departureHour || "Select time..."}
              </Text>
              <Feather name="clock" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
            {showDepTime && (
              <DateTimePicker
                value={parseTime(legData.departureHour)}
                mode="time"
                is24Hour
                display="default"
                onChange={(_: DateTimePickerEvent, d?: Date) => {
                  setShowDepTime(false);
                  if (d) update("departureHour", fmtTime(d));
                }}
              />
            )}
          </FieldRow>

          <FieldRow label="Country *">
            <TouchableOpacity
              onPress={() => setShowDepCountry(true)}
              style={[styles.selectTrigger, { borderColor: colors.border }]}
            >
              <Text
                style={[
                  styles.selectTriggerText,
                  { color: legData.departureCountry ? colors.foreground : colors.mutedForeground },
                ]}
                numberOfLines={1}
              >
                {legData.departureCountry
                  ? legData.departureCountry + " \u2014 " + depCountryName
                  : "Select country..."}
              </Text>
              <Feather name="chevron-down" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          </FieldRow>

          <FieldRow label="City *">
            <TouchableOpacity
              onPress={() => {
                if (!legData.departureCountry) {
                  Alert.alert("Select Country First", "Please select a departure country first.");
                  return;
                }
                setShowDepCity(true);
              }}
              style={[styles.selectTrigger, { borderColor: colors.border }]}
            >
              <Text
                style={[
                  styles.selectTriggerText,
                  { color: legData.departureCity ? colors.foreground : colors.mutedForeground },
                ]}
                numberOfLines={1}
              >
                {legData.departureCity ? depCityName : "Select city..."}
              </Text>
              <Feather name="chevron-down" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          </FieldRow>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Arrival</Text>

          <FieldRow label="Date *">
            <TouchableOpacity
              onPress={() => setShowArrDate(true)}
              style={[styles.selectTrigger, { borderColor: colors.border }]}
            >
              <Text style={[styles.selectTriggerText, { color: legData.arrivalDate ? colors.foreground : colors.mutedForeground }]}>
                {legData.arrivalDate || "Select date..."}
              </Text>
              <Feather name="calendar" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
            {showArrDate && (
              <DateTimePicker
                value={parseDate(legData.arrivalDate)}
                mode="date"
                display="default"
                onChange={(_: DateTimePickerEvent, d?: Date) => {
                  setShowArrDate(false);
                  if (d) update("arrivalDate", fmtDate(d));
                }}
              />
            )}
          </FieldRow>

          <FieldRow label="Hour *">
            <TouchableOpacity
              onPress={() => setShowArrTime(true)}
              style={[styles.selectTrigger, { borderColor: colors.border }]}
            >
              <Text style={[styles.selectTriggerText, { color: legData.arrivalHour ? colors.foreground : colors.mutedForeground }]}>
                {legData.arrivalHour || "Select time..."}
              </Text>
              <Feather name="clock" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
            {showArrTime && (
              <DateTimePicker
                value={parseTime(legData.arrivalHour)}
                mode="time"
                is24Hour
                display="default"
                onChange={(_: DateTimePickerEvent, d?: Date) => {
                  setShowArrTime(false);
                  if (d) update("arrivalHour", fmtTime(d));
                }}
              />
            )}
          </FieldRow>

          <FieldRow label="Country *">
            <TouchableOpacity
              onPress={() => setShowArrCountry(true)}
              style={[styles.selectTrigger, { borderColor: colors.border }]}
            >
              <Text
                style={[
                  styles.selectTriggerText,
                  { color: legData.arrivalCountry ? colors.foreground : colors.mutedForeground },
                ]}
                numberOfLines={1}
              >
                {legData.arrivalCountry
                  ? legData.arrivalCountry + " \u2014 " + arrCountryName
                  : "Select country..."}
              </Text>
              <Feather name="chevron-down" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          </FieldRow>

          <FieldRow label="City *">
            <TouchableOpacity
              onPress={() => {
                if (!legData.arrivalCountry) {
                  Alert.alert("Select Country First", "Please select an arrival country first.");
                  return;
                }
                setShowArrCity(true);
              }}
              style={[styles.selectTrigger, { borderColor: colors.border }]}
            >
              <Text
                style={[
                  styles.selectTriggerText,
                  { color: legData.arrivalCity ? colors.foreground : colors.mutedForeground },
                ]}
                numberOfLines={1}
              >
                {legData.arrivalCity ? arrCityName : "Select city..."}
              </Text>
              <Feather name="chevron-down" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          </FieldRow>
        </View>

        <View style={styles.hotelSection}>
          <View style={styles.hotelSectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Hotel Nights</Text>
            <View style={styles.hotelActions}>
              <TouchableOpacity
                onPress={handleAddHotel}
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              >
                <Feather name="plus" size={14} color="#FFF" />
                <Text style={styles.actionBtnText}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={selectedIds.size > 0 ? handleDeleteSelected : undefined}
                disabled={selectedIds.size === 0}
                style={[styles.actionBtn, { backgroundColor: selectedIds.size > 0 ? colors.destructive : colors.border }]}
              >
                <Feather name="trash-2" size={14} color={selectedIds.size > 0 ? "#FFF" : colors.mutedForeground} />
                <Text style={[styles.actionBtnText, { color: selectedIds.size > 0 ? "#FFF" : colors.mutedForeground }]}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={hotels.length > 0 ? handleClear : undefined}
                disabled={hotels.length === 0}
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor: "transparent",
                    borderWidth: 1,
                    borderColor: hotels.length > 0 ? colors.border : colors.border,
                    opacity: hotels.length > 0 ? 1 : 0.4,
                  },
                ]}
              >
                <Text style={[styles.actionBtnText, { color: hotels.length > 0 ? colors.destructive : colors.mutedForeground }]}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>

          {hotels.length === 0 ? (
            <View style={[styles.emptyHotels, { borderColor: colors.border }]}>
              <Feather name="moon" size={28} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No hotel nights added
              </Text>
            </View>
          ) : (
            <View style={styles.hotelList}>
              {hotels.map((hotel) => (
                <HotelRow
                  key={hotel.id}
                  travel={hotel}
                  isSelected={selectedIds.has(hotel.id)}
                  onToggle={() => toggleSelected(hotel.id)}
                  onPress={() => router.push({ pathname: "/edit-hotel-night/[id]", params: { id: String(hotel.id), legId: String(legId) } })}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {anyPickerOpen && (
        <>
          <CountryPickerModal
            visible={showDepCountry}
            selected={legData.departureCountry}
            onSelect={(code) => {
              update("departureCountry", code);
              const cities = getCities(code);
              update("departureCity", cities.length === 1 && cities[0]?.code === "ALL" ? "ALL" : "");
            }}
            onClose={() => setShowDepCountry(false)}
          />
          <CityPickerModal
            visible={showDepCity}
            countryCode={legData.departureCountry}
            selected={legData.departureCity}
            onSelect={(code) => update("departureCity", code)}
            onClose={() => setShowDepCity(false)}
          />
          <CountryPickerModal
            visible={showArrCountry}
            selected={legData.arrivalCountry}
            onSelect={(code) => {
              update("arrivalCountry", code);
              const cities = getCities(code);
              update("arrivalCity", cities.length === 1 && cities[0]?.code === "ALL" ? "ALL" : "");
            }}
            onClose={() => setShowArrCountry(false)}
          />
          <CityPickerModal
            visible={showArrCity}
            countryCode={legData.arrivalCountry}
            selected={legData.arrivalCity}
            onSelect={(code) => update("arrivalCity", code)}
            onClose={() => setShowArrCity(false)}
          />
        </>
      )}
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
  headerAction: { fontSize: 15, fontFamily: "Inter_600SemiBold", minWidth: 60, textAlign: "center" },
  content: { padding: 16, gap: 16 },
  section: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 12 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  fieldRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium", width: 76 },
  fieldValue: { flex: 1 },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  selectTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  selectTriggerText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  hotelSection: { gap: 12 },
  hotelSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  hotelActions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#FFF" },
  emptyHotels: {
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: "dashed",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 36,
    gap: 10,
  },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  noCitiesNote: { fontSize: 13, fontFamily: "Inter_400Regular", fontStyle: "italic", paddingVertical: 10 },
  hotelList: { gap: 8 },
  hotelRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  hotelRowContent: { flex: 1, gap: 2 },
  hotelRowMain: { flexDirection: "row", alignItems: "center", gap: 4 },
  hotelRate: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  hotelNights: { fontSize: 12, fontFamily: "Inter_400Regular" },
  hotelNote: { fontSize: 12, fontFamily: "Inter_400Regular" },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  pickerSearch: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerSearchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 10,
  },
  pickerOptionCode: { fontSize: 13, fontFamily: "Inter_600SemiBold", width: 36 },
  pickerOptionName: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  pickerEmpty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 12 },
  pickerEmptyText: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },
  smallBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  smallBtnText: { color: "#FFF", fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
