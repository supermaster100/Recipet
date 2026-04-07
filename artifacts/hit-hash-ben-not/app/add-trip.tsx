import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
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

import { useAppContext } from "@/context/AppContext";
import { TravelDB } from "@/db/database";
import { useColors } from "@/hooks/useColors";

function today(): string {
  return new Date().toISOString().split("T")[0] ?? "";
}

export default function AddTripScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { refreshTravels } = useAppContext();

  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(today());
  const [saving, setSaving] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const id = await TravelDB.insert({ name, purpose, startDate, endDate });
      await refreshTravels();
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
          disabled={saving || !name.trim()}
          hitSlop={8}
        >
          <Text
            style={[
              styles.saveBtn,
              { color: !name.trim() ? colors.mutedForeground : colors.primary },
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
        {[
          { label: "Trip Name", value: name, setter: setName, placeholder: "e.g. NYC Conference 2025" },
          { label: "Purpose", value: purpose, setter: setPurpose, placeholder: "e.g. Business meeting" },
          { label: "Start Date", value: startDate, setter: setStartDate, placeholder: "YYYY-MM-DD" },
          { label: "End Date", value: endDate, setter: setEndDate, placeholder: "YYYY-MM-DD" },
        ].map((field) => (
          <View key={field.label} style={styles.field}>
            <Text
              style={[styles.fieldLabel, { color: colors.mutedForeground }]}
            >
              {field.label.toUpperCase()}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.foreground,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              value={field.value}
              onChangeText={field.setter}
              placeholder={field.placeholder}
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
        ))}
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
});
