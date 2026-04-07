import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useNavigation, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import { CashWalletDB, ReceiptDB } from "@/db/database";
import { CURRENCIES, RECEIPT_TYPES, migrateReceiptType, type Currency, type PaymentMethod, type ReceiptType } from "@/db/types";
import { useColors } from "@/hooks/useColors";
import { ImageField, type ImageFieldHandle } from "@/components/ui/ImageField";
import { saveDraft, loadDraft, clearDraft } from "@/db/draftManager";
import { checkDiskSpace } from "@/db/dataProtection";
import { savePhotoToOrganizedStorage, savePhotoToGallery, computeFileChecksum } from "@/db/photoStorage";
import * as FileSystem from "expo-file-system/legacy";

const DRAFT_KEY = "add-expense" as const;
const DRAFT_SAVE_INTERVAL_MS = 30_000;

interface ExpenseDraft {
  type: ReceiptType;
  amount: string;
  currency: Currency;
  date: string;
  numberOfPeople: string;
  selectedCostCenter: string;
  photo: string;
  selfDeclaration: boolean;
  note: string;
  paymentMethod: PaymentMethod;
}

function today(): string {
  return new Date().toISOString().split("T")[0] ?? "";
}

interface FormErrors {
  type?: string;
  amount?: string;
  currency?: string;
  date?: string;
  numberOfPeople?: string;
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

function AutoFilledBadge({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[autoFillStyles.badge, { backgroundColor: colors.primary + "18" }]}>
      <Feather name="zap" size={10} color={colors.primary} />
      <Text style={[autoFillStyles.badgeText, { color: colors.primary }]}>Auto-detected</Text>
    </View>
  );
}

const autoFillStyles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 99,
  },
  badgeText: { fontSize: 10, fontFamily: "Inter_500Medium" },
});

export default function AddExpenseScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { refreshReceipts, general, costCenters, refreshCashWallet } = useAppContext();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const params = useLocalSearchParams<{
    photo?: string;
    currency?: string;
    amount?: string;
    date?: string;
    autoFilled?: string;
  }>();

  const isFromScan = params.autoFilled === "true";

  const [type, setType] = useState<ReceiptType>("HOSTING_MYSELF");
  const [amount, setAmount] = useState(params.amount ?? "");
  const [currency, setCurrency] = useState<Currency>((params.currency as Currency) ?? "ILS");
  const [date, setDate] = useState(params.date ?? today());
  const [numberOfPeople, setNumberOfPeople] = useState("1");
  const [photo, setPhoto] = useState(params.photo ?? "");
  const [selfDeclaration, setSelfDeclaration] = useState(true);
  const [note, setNote] = useState("");
  const [selectedCostCenter, setSelectedCostCenter] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  const [autoFilledFields] = useState<Set<string>>(() => {
    const fields = new Set<string>();
    if (isFromScan) {
      if (params.currency) fields.add("currency");
      if (params.amount) fields.add("amount");
      if (params.date) fields.add("date");
      if (params.photo) fields.add("photo");
    }
    return fields;
  });

  const imageFieldRef = useRef<ImageFieldHandle>(null);

  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(isFromScan);
  const [draftLoaded, setDraftLoaded] = useState(isFromScan);

  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showCostCenterPicker, setShowCostCenterPicker] = useState(false);

  useEffect(() => {
    setSelfDeclaration(photo.trim().length === 0);
  }, [photo]);

  useEffect(() => {
    loadDraft<ExpenseDraft>(DRAFT_KEY).then((draft) => {
      if (!draft) return;
      Alert.alert(
        "Resume Entry?",
        "You have an unsaved expense entry. Would you like to resume it?",
        [
          {
            text: "Discard",
            style: "destructive",
            onPress: () => clearDraft(DRAFT_KEY),
          },
          {
            text: "Resume",
            onPress: () => {
              setType(migrateReceiptType(draft.type));
              setAmount(draft.amount);
              setCurrency(draft.currency);
              setDate(draft.date);
              setNumberOfPeople(draft.numberOfPeople);
              setSelectedCostCenter(draft.selectedCostCenter ?? "");
              setPhoto(draft.photo ?? "");
              setSelfDeclaration(draft.selfDeclaration);
              setNote(draft.note);
              setPaymentMethod(draft.paymentMethod ?? "cash");
              setDirty(true);
              setDraftLoaded(true);
            },
          },
        ]
      );
    });
  }, []);

  const getDraftData = useCallback((): ExpenseDraft => ({
    type,
    amount,
    currency,
    date,
    numberOfPeople,
    selectedCostCenter,
    photo,
    selfDeclaration,
    note,
    paymentMethod,
  }), [type, amount, currency, date, numberOfPeople, selectedCostCenter, photo, selfDeclaration, note, paymentMethod]);

  useEffect(() => {
    if (!dirty || saved) return;
    const interval = setInterval(() => {
      saveDraft(DRAFT_KEY, getDraftData());
    }, DRAFT_SAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [dirty, saved, getDraftData]);

  useEffect(() => {
    if (dirty && !saved) {
      saveDraft(DRAFT_KEY, getDraftData());
    }
  }, [dirty, saved, getDraftData, type, amount, currency, date, numberOfPeople, selectedCostCenter, photo, selfDeclaration, note, paymentMethod]);

  const confirmDiscard = useCallback(() => {
    if (Platform.OS === "web") {
      const ok = window.confirm("You have unsaved changes. Are you sure you want to go back?");
      if (ok) clearDraft(DRAFT_KEY);
      return Promise.resolve(ok);
    }
    return new Promise<boolean>((resolve) => {
      Alert.alert(
        "Discard changes?",
        "You have unsaved changes. Are you sure you want to go back?",
        [
          { text: "Keep Editing", style: "cancel", onPress: () => resolve(false) },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              clearDraft(DRAFT_KEY);
              resolve(true);
            },
          },
        ]
      );
    });
  }, []);

  useEffect(() => {
    if (!dirty || saved) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      confirmDiscard().then((ok) => { if (ok) router.back(); });
      return true;
    });
    return () => sub.remove();
  }, [dirty, saved, confirmDiscard]);

  useEffect(() => {
    if (!dirty || saved) return;
    type BeforeRemoveEvent = { preventDefault: () => void; data: { action: Parameters<typeof navigation.dispatch>[0] } };
    const unsubscribe = navigation.addListener("beforeRemove" as never, (e: BeforeRemoveEvent) => {
      e.preventDefault();
      confirmDiscard().then((ok) => { if (ok) navigation.dispatch(e.data.action); });
    });
    return unsubscribe;
  }, [dirty, saved, navigation, confirmDiscard]);

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
    numberOfPeople.trim().length > 0;

  async function handleSave() {
    if (!validate()) return;
    if (!photo.trim()) {
      if (Platform.OS === "web") {
        const confirmed = window.confirm(
          "No photo attached. Save as self-declaration receipt?"
        );
        if (confirmed) {
          doSave(true);
        }
        return;
      }
      Alert.alert(
        "No Photo",
        "Would you like to add a receipt photo?",
        [
          {
            text: "Add Photo",
            onPress: () => { imageFieldRef.current?.show(); },
          },
          {
            text: "Save Without Photo",
            style: "destructive",
            onPress: () => doSave(true),
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
      return;
    }
    doSave(false);
  }

  async function doSave(forceNoPhoto: boolean) {
    const hasSpace = await checkDiskSpace();
    if (!hasSpace) return;

    setSaving(true);
    const effectiveSelfDecl = forceNoPhoto ? true : selfDeclaration;
    let finalPhotoPath: string | null = photo.trim() || null;
    let photoChecksum: string | null = null;
    let organizedPhotoPath: string | null = null;

    try {
      if (finalPhotoPath && Platform.OS !== "web") {
        const organized = await savePhotoToOrganizedStorage(finalPhotoPath, type);
        if (organized) {
          organizedPhotoPath = organized;
          await savePhotoToGallery(organized).catch(() => {});
          photoChecksum = await computeFileChecksum(organized).catch(() => null);
          finalPhotoPath = organized;
        }
      }

      const newId = await ReceiptDB.insert({
        type,
        amount: parseFloat(Number(amount).toFixed(2)),
        currency,
        date,
        numberOfPeople: Math.max(1, parseInt(numberOfPeople) || 1),
        division: "",
        costCenter: selectedCostCenter,
        selfDeclaration: effectiveSelfDecl,
        note: note.trim(),
        photo: finalPhotoPath,
        photo_checksum: photoChecksum,
        budget: "",
        status: "",
        export: false,
        deleted_at: null,
        paymentMethod,
      });
      if (paymentMethod === "cash") {
        await CashWalletDB.insert({
          currency,
          amount: -parseFloat(Number(amount).toFixed(2)),
          entryType: "expense_cash",
          refId: newId,
          refTable: "Receipts",
          note: `Expense: ${RECEIPT_TYPES.find((r) => r.key === type)?.label ?? type}`,
          createdAt: new Date().toISOString(),
        });
        await refreshCashWallet();
      }
      await clearDraft(DRAFT_KEY);
      await refreshReceipts();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDirty(false);
      setSaved(true);
    } catch {
      if (organizedPhotoPath && Platform.OS !== "web") {
        await FileSystem.deleteAsync(organizedPhotoPath, { idempotent: true }).catch(() => {});
      }
      Alert.alert("Error", "Failed to save receipt. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  }

  function handleBack() {
    if (dirty && !saved) {
      confirmDiscard().then((ok) => { if (ok) goBack(); });
    } else {
      goBack();
    }
  }

  function resetForm() {
    setType("HOSTING_MYSELF");
    setAmount("");
    setCurrency("ILS");
    setDate(today());
    setNumberOfPeople("1");
    setSelectedCostCenter("");
    setPhoto("");
    setNote("");
    setPaymentMethod("cash");
    setErrors({});
    setDirty(false);
    setSaved(false);
    setDraftLoaded(false);
  }

  if (saved) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topInset + 8, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={goBack} hitSlop={8}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Receipt Saved</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: colors.success + "22" }]}>
            <Feather name="check-circle" size={48} color={colors.success} />
          </View>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>
            Receipt added successfully!
          </Text>
          <Text style={[styles.successSubtitle, { color: colors.mutedForeground }]}>
            Your expense has been recorded.
          </Text>
          <TouchableOpacity
            onPress={resetForm}
            style={[styles.addAnotherBtn, { backgroundColor: colors.primary }]}
          >
            <Feather name="plus" size={18} color="#fff" />
            <Text style={styles.addAnotherText}>Add New Receipt</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goBack}
            style={[styles.doneBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.doneBtnText, { color: colors.foreground }]}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const selectedTypeLabel = RECEIPT_TYPES.find((r) => r.key === type)?.label ?? type;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: topInset + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleBack} hitSlop={8} accessibilityLabel="close">
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>New Receipt</Text>
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

      {isFromScan && autoFilledFields.size > 0 && (
        <View style={[styles.autoFillBanner, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
          <Feather name="zap" size={14} color={colors.primary} />
          <Text style={[styles.autoFillBannerText, { color: colors.primary }]}>
            Highlighted fields were auto-detected from your receipt. Please review before saving.
          </Text>
        </View>
      )}

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

        {costCenters.length > 0 && (
          <View style={styles.field}>
            <FieldLabel text="Cost Center" />
            <TouchableOpacity
              onPress={() => setShowCostCenterPicker(true)}
              style={[
                styles.pickerBtn,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text
                style={[
                  styles.pickerBtnText,
                  { color: selectedCostCenter ? colors.foreground : colors.mutedForeground },
                ]}
              >
                {selectedCostCenter || "Select cost center (optional)"}
              </Text>
              <Feather name="chevron-down" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.field}>
          <View style={styles.labelRow}>
            <FieldLabel text="Amount" required />
            {autoFilledFields.has("amount") && (
              <AutoFilledBadge colors={colors} />
            )}
          </View>
          <View style={styles.amountRow}>
            <TextInput
              value={amount}
              onChangeText={(v) => { setAmount(v); markDirty(); if (errors.amount) setErrors((e) => ({ ...e, amount: undefined })); autoFilledFields.delete("amount"); }}
              placeholder="0.00"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="decimal-pad"
              style={[
                formStyles.input,
                {
                  color: colors.foreground,
                  backgroundColor: autoFilledFields.has("amount") ? colors.primary + "10" : colors.card,
                  borderColor: errors.amount ? colors.destructive : autoFilledFields.has("amount") ? colors.primary + "60" : colors.border,
                },
              ]}
            />
            <TouchableOpacity
              onPress={() => setShowCurrencyPicker(true)}
              style={[
                styles.currencyBtn,
                {
                  backgroundColor: colors.primary,
                  borderColor: autoFilledFields.has("currency") ? colors.primary : colors.primary,
                },
              ]}
            >
              <Text style={styles.currencyBtnText}>{currency}</Text>
              <Feather name="chevron-down" size={12} color="#fff" />
              {autoFilledFields.has("currency") && (
                <View style={styles.autoFilledDot} />
              )}
            </TouchableOpacity>
          </View>
          <FieldError msg={errors.amount} />
        </View>

        <View style={styles.field}>
          <View style={styles.labelRow}>
            <FieldLabel text="Date" required />
            {autoFilledFields.has("date") && (
              <AutoFilledBadge colors={colors} />
            )}
          </View>
          <TextInput
            value={date}
            onChangeText={(v) => { setDate(v); markDirty(); if (errors.date) setErrors((e) => ({ ...e, date: undefined })); autoFilledFields.delete("date"); }}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            style={[
              formStyles.input,
              {
                flex: 1,
                color: colors.foreground,
                backgroundColor: autoFilledFields.has("date") ? colors.primary + "10" : colors.card,
                borderColor: errors.date ? colors.destructive : autoFilledFields.has("date") ? colors.primary + "60" : colors.border,
              },
            ]}
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
          <FieldLabel text="Photo" />
          <ImageField
            ref={imageFieldRef}
            value={photo}
            onChange={(p) => { setPhoto(p); markDirty(); }}
          />
        </View>

        <View style={styles.field}>
          <FieldLabel text="Self Declaration" />
          <View style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleTitle, { color: colors.foreground }]}>
                Self declaration receipt
              </Text>
              <Text style={[styles.toggleSubtitle, { color: colors.mutedForeground }]}>
                {photo.trim() ? "Auto-disabled — photo attached" : "Auto-enabled — no photo"}
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
          <FieldLabel text="Payment Method" />
          <View style={styles.paymentToggleRow}>
            <TouchableOpacity
              onPress={() => { setPaymentMethod("cash"); markDirty(); }}
              style={[
                styles.paymentOption,
                {
                  backgroundColor: paymentMethod === "cash" ? colors.primary : colors.card,
                  borderColor: paymentMethod === "cash" ? colors.primary : colors.border,
                },
              ]}
            >
              <Feather name="dollar-sign" size={16} color={paymentMethod === "cash" ? "#fff" : colors.mutedForeground} />
              <Text style={[styles.paymentOptionText, { color: paymentMethod === "cash" ? "#fff" : colors.foreground }]}>
                Cash
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setPaymentMethod("card"); markDirty(); }}
              style={[
                styles.paymentOption,
                {
                  backgroundColor: paymentMethod === "card" ? colors.primary : colors.card,
                  borderColor: paymentMethod === "card" ? colors.primary : colors.border,
                },
              ]}
            >
              <Feather name="credit-card" size={16} color={paymentMethod === "card" ? "#fff" : colors.mutedForeground} />
              <Text style={[styles.paymentOptionText, { color: paymentMethod === "card" ? "#fff" : colors.foreground }]}>
                Card
              </Text>
            </TouchableOpacity>
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
      {costCenters.length > 0 && (
        <PickerModal
          visible={showCostCenterPicker}
          title="Cost Center"
          options={["", ...costCenters.map((c) => c.name)]}
          value={selectedCostCenter}
          renderLabel={(v) => v || "No cost center"}
          onSelect={(v) => { setSelectedCostCenter(v); markDirty(); }}
          onClose={() => setShowCostCenterPicker(false)}
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
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  saveBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  form: { padding: 16, gap: 16 },
  field: { gap: 6 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  autoFillBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  autoFillBannerText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  autoFilledDot: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFD700",
  },
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
    borderWidth: 1,
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
  paymentToggleRow: { flexDirection: "row", gap: 8 },
  paymentOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
  },
  paymentOptionText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  successTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  successSubtitle: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 8 },
  addAnotherBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    width: "100%",
    justifyContent: "center",
  },
  addAnotherText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  doneBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    width: "100%",
    alignItems: "center",
  },
  doneBtnText: { fontSize: 16, fontFamily: "Inter_500Medium" },
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
