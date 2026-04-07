import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
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

import { useAppContext } from "@/context/AppContext";
import { ReceiptDB } from "@/db/database";
import { CURRENCIES, RECEIPT_TYPES, type Currency, type ReceiptType } from "@/db/types";
import { useColors } from "@/hooks/useColors";

interface FormErrors {
  type?: string;
  amount?: string;
  currency?: string;
  date?: string;
  numberOfPeople?: string;
  division?: string;
  costCenter?: string;
}

function FieldLabel({ text, required }: { text: string; required?: boolean }) {
  const colors = useColors();
  return (
    <Text style={[formStyles.label, { color: colors.mutedForeground }]}>
      {text}
      {required && <Text style={{ color: colors.destructive }}> *</Text>}
    </Text>
  );
}

function FieldError({ msg }: { msg?: string }) {
  const colors = useColors();
  if (!msg) return null;
  return <Text style={[formStyles.error, { color: colors.destructive }]}>{msg}</Text>;
}

function StyledInput({
  value,
  onChangeText,
  placeholder,
  keyboardType,
  error,
  autoCapitalize,
  multiline,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "decimal-pad" | "numeric" | "number-pad";
  error?: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  multiline?: boolean;
}) {
  const colors = useColors();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.mutedForeground}
      keyboardType={keyboardType ?? "default"}
      autoCapitalize={autoCapitalize ?? "sentences"}
      multiline={multiline}
      style={[
        formStyles.input,
        multiline && { height: 80, textAlignVertical: "top" },
        {
          color: colors.foreground,
          backgroundColor: colors.card,
          borderColor: error ? colors.destructive : colors.border,
        },
      ]}
    />
  );
}

function PickerModal({
  visible,
  title,
  options,
  value,
  onSelect,
  onClose,
  renderLabel,
}: {
  visible: boolean;
  title: string;
  options: string[];
  value: string;
  onSelect: (v: string) => void;
  onClose: () => void;
  renderLabel?: (v: string) => string;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={[pickerStyles.container, { backgroundColor: colors.background }]}>
        <View style={pickerStyles.handle}>
          <View style={[pickerStyles.handleBar, { backgroundColor: colors.border }]} />
        </View>
        <View style={[pickerStyles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Text style={[pickerStyles.cancel, { color: colors.mutedForeground }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[pickerStyles.title, { color: colors.foreground }]}>{title}</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
          {options.map((opt) => {
            const label = renderLabel ? renderLabel(opt) : opt;
            const active = opt === value;
            return (
              <TouchableOpacity
                key={opt}
                onPress={() => { onSelect(opt); onClose(); }}
                style={[
                  pickerStyles.option,
                  {
                    backgroundColor: active ? colors.primary + "18" : "transparent",
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <Text style={[pickerStyles.optionText, { color: active ? colors.primary : colors.foreground }]}>
                  {label}
                </Text>
                {active && <Feather name="check" size={18} color={colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { refreshReceipts, receipts, budgets } = useAppContext();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const receipt = receipts.find((e) => e.id === Number(id));

  const [type, setType] = useState<ReceiptType>(receipt?.type ?? "MEALS");
  const [amount, setAmount] = useState(receipt ? String(receipt.amount) : "");
  const [currency, setCurrency] = useState<Currency>(receipt?.currency ?? "ILS");
  const [date, setDate] = useState(receipt?.date ?? "");
  const [numberOfPeople, setNumberOfPeople] = useState(String(receipt?.numberOfPeople ?? "1"));
  const [division, setDivision] = useState(receipt?.division ?? "");
  const [costCenter, setCostCenter] = useState(receipt?.costCenter ?? "");
  const [selfDeclaration, setSelfDeclaration] = useState(receipt?.selfDeclaration ?? true);
  const [note, setNote] = useState(receipt?.note ?? "");
  const [budgetId, setBudgetId] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showBudgetPicker, setShowBudgetPicker] = useState(false);

  function markDirty() {
    if (!dirty) setDirty(true);
  }

  function validate(): boolean {
    const e: FormErrors = {};
    if (!type) e.type = "Expense type is required";
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0)
      e.amount = "Enter a valid amount";
    if (!currency) e.currency = "Currency is required";
    if (!date.trim()) e.date = "Date is required";
    const nop = Number(numberOfPeople);
    if (!numberOfPeople.trim() || isNaN(nop) || nop < 1)
      e.numberOfPeople = "Enter at least 1 person";
    if (!division.trim()) e.division = "Division is required";
    if (!costCenter.trim()) e.costCenter = "Cost center is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const isValid =
    !!type &&
    amount.trim().length > 0 &&
    !isNaN(Number(amount)) &&
    Number(amount) > 0 &&
    !!currency &&
    date.trim().length > 0 &&
    numberOfPeople.trim().length > 0 &&
    division.trim().length > 0 &&
    costCenter.trim().length > 0;

  async function handleSave() {
    if (!receipt || !validate()) return;
    setSaving(true);
    try {
      await ReceiptDB.update({
        id: receipt.id,
        type,
        amount: parseFloat(Number(amount).toFixed(2)),
        currency,
        date,
        numberOfPeople: Math.max(1, parseInt(numberOfPeople) || 1),
        division: division.trim(),
        costCenter: costCenter.trim(),
        selfDeclaration,
        note: note.trim(),
        photo: receipt.photo,
        status: receipt.status,
        export: receipt.export,
      });
      await refreshReceipts();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDirty(false);
      router.back();
    } catch {
      Alert.alert("Error", "Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!receipt) return;
    Alert.alert("Delete Receipt", "Are you sure you want to delete this receipt?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await ReceiptDB.delete(receipt.id);
          await refreshReceipts();
          router.back();
        },
      },
    ]);
  }

  function handleBack() {
    if (dirty) {
      Alert.alert(
        "Discard changes?",
        "You have unsaved changes. Are you sure you want to go back?",
        [
          { text: "Keep Editing", style: "cancel" },
          { text: "Discard", style: "destructive", onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  }

  if (!receipt) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topInset + 8, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Receipt</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.notFound}>
          <Feather name="alert-circle" size={40} color={colors.mutedForeground} />
          <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>Receipt not found</Text>
        </View>
      </View>
    );
  }

  const selectedTypeLabel = RECEIPT_TYPES.find((r) => r.key === type)?.label ?? type;
  const selectedBudget = budgets.find((b) => String(b.id) === budgetId);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: topInset + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleBack} hitSlop={8}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Edit Receipt</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleDelete} hitSlop={8}>
            <Feather name="trash-2" size={20} color={colors.destructive} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!isValid || saving}
            style={[
              styles.saveBtn,
              { backgroundColor: isValid && !saving ? colors.primary : colors.primary + "50" },
            ]}
          >
            <Text style={[styles.saveBtnText, { color: "#fff" }]}>
              {saving ? "Saving…" : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.field}>
          <FieldLabel text="Expense Type" required />
          <TouchableOpacity
            onPress={() => setShowTypePicker(true)}
            style={[
              styles.pickerBtn,
              {
                backgroundColor: colors.card,
                borderColor: errors.type ? colors.destructive : colors.border,
              },
            ]}
          >
            <Text style={[styles.pickerBtnText, { color: colors.foreground }]}>
              {selectedTypeLabel}
            </Text>
            <Feather name="chevron-down" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
          <FieldError msg={errors.type} />
        </View>

        {budgets.length > 0 && (
          <View style={styles.field}>
            <FieldLabel text="Budget" />
            <TouchableOpacity
              onPress={() => setShowBudgetPicker(true)}
              style={[styles.pickerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text
                style={[
                  styles.pickerBtnText,
                  { color: selectedBudget ? colors.foreground : colors.mutedForeground },
                ]}
              >
                {selectedBudget
                  ? `#${selectedBudget.budgetNumber} — ${selectedBudget.budgetNumberName}`
                  : "Select budget (optional)"}
              </Text>
              <Feather name="chevron-down" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.field}>
          <FieldLabel text="Amount" required />
          <View style={styles.amountRow}>
            <StyledInput
              value={amount}
              onChangeText={(v) => { setAmount(v); markDirty(); if (errors.amount) setErrors((e) => ({ ...e, amount: undefined })); }}
              placeholder="0.00"
              keyboardType="decimal-pad"
              error={errors.amount}
            />
            <TouchableOpacity
              onPress={() => setShowCurrencyPicker(true)}
              style={[styles.currencyBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.currencyBtnText}>{currency}</Text>
              <Feather name="chevron-down" size={12} color="#fff" />
            </TouchableOpacity>
          </View>
          <FieldError msg={errors.amount} />
        </View>

        <View style={styles.field}>
          <FieldLabel text="Date" required />
          <StyledInput
            value={date}
            onChangeText={(v) => { setDate(v); markDirty(); if (errors.date) setErrors((e) => ({ ...e, date: undefined })); }}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            error={errors.date}
          />
          <FieldError msg={errors.date} />
        </View>

        <View style={styles.field}>
          <FieldLabel text="Number of People" required />
          <StyledInput
            value={numberOfPeople}
            onChangeText={(v) => { setNumberOfPeople(v); markDirty(); if (errors.numberOfPeople) setErrors((e) => ({ ...e, numberOfPeople: undefined })); }}
            placeholder="1"
            keyboardType="number-pad"
            error={errors.numberOfPeople}
          />
          <FieldError msg={errors.numberOfPeople} />
        </View>

        <View style={styles.field}>
          <FieldLabel text="Division" required />
          <StyledInput
            value={division}
            onChangeText={(v) => { setDivision(v); markDirty(); if (errors.division) setErrors((e) => ({ ...e, division: undefined })); }}
            placeholder="e.g. Finance"
            error={errors.division}
          />
          <FieldError msg={errors.division} />
        </View>

        <View style={styles.field}>
          <FieldLabel text="Cost Center" required />
          <StyledInput
            value={costCenter}
            onChangeText={(v) => { setCostCenter(v); markDirty(); if (errors.costCenter) setErrors((e) => ({ ...e, costCenter: undefined })); }}
            placeholder="e.g. CC-001"
            autoCapitalize="characters"
            error={errors.costCenter}
          />
          <FieldError msg={errors.costCenter} />
        </View>

        <View style={styles.field}>
          <FieldLabel text="Self Declaration" />
          <View style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleTitle, { color: colors.foreground }]}>
                Self declaration receipt
              </Text>
              <Text style={[styles.toggleSubtitle, { color: colors.mutedForeground }]}>
                No photo attached — manually entered
              </Text>
            </View>
            <Switch
              value={selfDeclaration}
              onValueChange={(v) => { setSelfDeclaration(v); markDirty(); }}
              trackColor={{ false: colors.border, true: colors.primary + "80" }}
              thumbColor={selfDeclaration ? colors.primary : colors.mutedForeground}
            />
          </View>
        </View>

        <View style={styles.field}>
          <FieldLabel text="Note (optional)" />
          <StyledInput
            value={note}
            onChangeText={(v) => { setNote(v); markDirty(); }}
            placeholder="What was this receipt for?"
            multiline
          />
        </View>
      </ScrollView>

      <PickerModal
        visible={showTypePicker}
        title="Expense Type"
        options={RECEIPT_TYPES.map((r) => r.key)}
        value={type}
        renderLabel={(k) => RECEIPT_TYPES.find((r) => r.key === k)?.label ?? k}
        onSelect={(v) => { setType(v as ReceiptType); markDirty(); if (errors.type) setErrors((e) => ({ ...e, type: undefined })); }}
        onClose={() => setShowTypePicker(false)}
      />
      <PickerModal
        visible={showCurrencyPicker}
        title="Currency"
        options={[...CURRENCIES]}
        value={currency}
        onSelect={(v) => { setCurrency(v as Currency); markDirty(); }}
        onClose={() => setShowCurrencyPicker(false)}
      />
      {budgets.length > 0 && (
        <PickerModal
          visible={showBudgetPicker}
          title="Budget"
          options={["", ...budgets.map((b) => String(b.id))]}
          value={budgetId}
          renderLabel={(v) => {
            if (!v) return "No budget";
            const b = budgets.find((b) => String(b.id) === v);
            return b ? `#${b.budgetNumber} — ${b.budgetNumberName}` : v;
          }}
          onSelect={(v) => { setBudgetId(v); markDirty(); }}
          onClose={() => setShowBudgetPicker(false)}
        />
      )}
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
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  saveBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  form: { padding: 16, gap: 16 },
  field: { gap: 6 },
  amountRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  pickerBtnText: { fontSize: 15, fontFamily: "Inter_400Regular", flex: 1 },
  currencyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderRadius: 10,
  },
  currencyBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  toggleInfo: { flex: 1, gap: 2 },
  toggleTitle: { fontSize: 15, fontFamily: "Inter_500Medium" },
  toggleSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontSize: 15, fontFamily: "Inter_400Regular" },
});

const formStyles = StyleSheet.create({
  label: { fontSize: 13, fontFamily: "Inter_500Medium" },
  error: { fontSize: 12, fontFamily: "Inter_400Regular" },
  input: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
});

const pickerStyles = StyleSheet.create({
  container: { flex: 1 },
  handle: { alignItems: "center", paddingTop: 16, paddingBottom: 8 },
  handleBar: { width: 36, height: 4, borderRadius: 2 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cancel: { fontSize: 15, fontFamily: "Inter_400Regular", width: 60 },
  title: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionText: { fontSize: 16, fontFamily: "Inter_400Regular" },
});
