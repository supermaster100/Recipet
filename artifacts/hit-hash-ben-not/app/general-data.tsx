import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GeneralDB } from "@/db/database";
import { useAppContext } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const MONTHS = [
  { label: "January", value: "1" },
  { label: "February", value: "2" },
  { label: "March", value: "3" },
  { label: "April", value: "4" },
  { label: "May", value: "5" },
  { label: "June", value: "6" },
  { label: "July", value: "7" },
  { label: "August", value: "8" },
  { label: "September", value: "9" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => {
  const y = currentYear - 2 + i;
  return { label: String(y), value: String(y) };
});

interface FormErrors {
  workerNumber?: string;
  month?: string;
  year?: string;
}

function FormInput({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "decimal-pad" | "number-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  const colors = useColors();

  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>
        {label} <Text style={{ color: colors.destructive }}>*</Text>
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize={autoCapitalize ?? "sentences"}
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            borderColor: error ? colors.destructive : colors.border,
            color: colors.foreground,
          },
        ]}
      />
      {error ? (
        <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
      ) : null}
    </View>
  );
}

function PickerField({
  label,
  value,
  options,
  onSelect,
  error,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onSelect: (v: string) => void;
  error?: string;
}) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>
        {label} <Text style={{ color: colors.destructive }}>*</Text>
      </Text>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setOpen(!open)}
        style={[
          styles.input,
          styles.pickerTrigger,
          {
            backgroundColor: colors.card,
            borderColor: error ? colors.destructive : colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.pickerText,
            { color: selected ? colors.foreground : colors.mutedForeground },
          ]}
        >
          {selected ? selected.label : `Select ${label}`}
        </Text>
        <Feather
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={colors.mutedForeground}
        />
      </TouchableOpacity>
      {open && (
        <View
          style={[
            styles.dropdown,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => {
                  onSelect(opt.value);
                  setOpen(false);
                }}
                style={[
                  styles.dropdownOption,
                  opt.value === value && { backgroundColor: colors.primary + "22" },
                ]}
              >
                <Text
                  style={[
                    styles.dropdownOptionText,
                    {
                      color: opt.value === value ? colors.primary : colors.foreground,
                      fontFamily:
                        opt.value === value ? "Inter_600SemiBold" : "Inter_400Regular",
                    },
                  ]}
                >
                  {opt.label}
                </Text>
                {opt.value === value && (
                  <Feather name="check" size={14} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      {error ? (
        <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
      ) : null}
    </View>
  );
}

export default function GeneralDataScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { general, refreshGeneral } = useAppContext();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const [workerNumber, setWorkerNumber] = useState("");
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const isFormValid =
    workerNumber.trim().length > 0 &&
    month.length > 0 &&
    year.length > 0;

  useEffect(() => {
    if (general) {
      setWorkerNumber(general.workerNumber);
      setMonth(String(general.month));
      setYear(String(general.year));
    }
  }, [general]);

  function validate(): boolean {
    const e: FormErrors = {};
    if (!workerNumber.trim()) e.workerNumber = "Worker number is required";
    if (!month) e.month = "Month is required";
    if (!year) e.year = "Year is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      await GeneralDB.upsert({
        workerNumber: workerNumber.trim(),
        month: Number(month),
        year: Number(year),
      });
      await refreshGeneral();
      if (Platform.OS === "web") {
        router.back();
        return;
      }
      Alert.alert("Saved", "General data saved successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Error", "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[
          styles.header,
          { paddingTop: topInset + 8, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          General Data
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!isFormValid || saving}
          style={[
            styles.saveBtn,
            {
              backgroundColor:
                !isFormValid || saving ? colors.primary + "50" : colors.primary,
            },
          ]}
        >
          <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
            {saving ? "Saving…" : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.sectionNote, { color: colors.mutedForeground }]}>
          This information is included in every exported report. All fields are required.
        </Text>


        <FormInput
          label="Worker Number"
          value={workerNumber}
          onChangeText={(v) => {
            setWorkerNumber(v);
            if (errors.workerNumber) setErrors((e) => ({ ...e, workerNumber: undefined }));
          }}
          error={errors.workerNumber}
          placeholder="e.g. 12345"
          autoCapitalize="none"
        />

        <PickerField
          label="Month"
          value={month}
          options={MONTHS}
          onSelect={(v) => {
            setMonth(v);
            if (errors.month) setErrors((e) => ({ ...e, month: undefined }));
          }}
          error={errors.month}
        />

        <PickerField
          label="Year"
          value={year}
          options={YEARS}
          onSelect={(v) => {
            setYear(v);
            if (errors.year) setErrors((e) => ({ ...e, year: undefined }));
          }}
          error={errors.year}
        />
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  saveBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  content: {
    padding: 16,
    gap: 16,
  },
  sectionNote: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    marginBottom: 4,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  pickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  dropdown: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    overflow: "hidden",
    marginTop: -4,
  },
  dropdownOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownOptionText: {
    fontSize: 15,
  },
  errorText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
