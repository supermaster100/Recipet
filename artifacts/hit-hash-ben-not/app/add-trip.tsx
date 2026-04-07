import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
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

import { useAppContext } from "@/context/AppContext";
import { LegDB } from "@/db/database";
import { useColors } from "@/hooks/useColors";

const LEG_TYPES = ["Business", "Personal", "Conference", "Training", "Other"];
const LEG_STATUSES = ["Planned", "In Progress", "Completed", "Cancelled"];

export default function AddTripScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { refreshLegs } = useAppContext();

  const [type, setType] = useState("Business");
  const [status, setStatus] = useState("Planned");
  const [saving, setSaving] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  async function handleSave() {
    if (!type.trim()) return;
    setSaving(true);
    try {
      const id = await LegDB.insert({
        type,
        status,
        departureDate: "",
        departureHour: "",
        departureCountry: "",
        departureCity: "",
        arrivalDate: "",
        arrivalHour: "",
        arrivalCountry: "",
        arrivalCity: "",
        deleted_at: null,
      });
      await refreshLegs();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/trip/${id}`);
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
          New Trip
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || !type.trim()}
          hitSlop={8}
        >
          <Text
            style={[
              styles.saveBtn,
              { color: !type.trim() ? colors.mutedForeground : colors.primary },
            ]}
          >
            Create
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
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>TRIP TYPE</Text>
          <View style={styles.chipRow}>
            {LEG_TYPES.map((t) => (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: type === t ? colors.primary : colors.card,
                    borderColor: type === t ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: type === t ? colors.primaryForeground : colors.foreground },
                  ]}
                >
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>STATUS</Text>
          <View style={styles.chipRow}>
            {LEG_STATUSES.map((s) => (
              <Pressable
                key={s}
                onPress={() => setStatus(s)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: status === s ? colors.primary : colors.card,
                    borderColor: status === s ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: status === s ? colors.primaryForeground : colors.foreground },
                  ]}
                >
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
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
  field: { gap: 8 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_500Medium", letterSpacing: 0.3 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8, borderWidth: 1 },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
});
