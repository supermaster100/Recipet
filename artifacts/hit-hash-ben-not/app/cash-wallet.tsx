import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
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

import { useAppContext } from "@/context/AppContext";
import { CashWalletDB } from "@/db/database";
import { EXCHANGE_CURRENCIES, type Currency } from "@/db/types";
import { CURRENCY_NAMES } from "@/db/currencyNames";
import { useFavouriteCurrencies, sortWithFavourites } from "@/hooks/useFavouriteCurrencies";
import { useColors } from "@/hooks/useColors";

type EntryTypeLabel = {
  initial: string;
  expense_cash: string;
  atm_withdrawal: string;
  money_transfer_in: string;
  client_transfer_out: string;
  manual_adjustment: string;
  exchange_in: string;
  exchange_out: string;
};

const ENTRY_TYPE_LABELS: EntryTypeLabel = {
  initial: "Cash from Home",
  expense_cash: "Cash Expense",
  atm_withdrawal: "ATM Withdrawal",
  money_transfer_in: "Money Received",
  client_transfer_out: "Client Transfer Out",
  manual_adjustment: "Manual Adjustment",
  exchange_in: "Exchange Received",
  exchange_out: "Exchange Spent",
};

function formatAmount(amount: number, currency: string): string {
  const sign = amount >= 0 ? "+" : "";
  return `${sign}${amount.toFixed(2)} ${currency}`;
}

interface PendingCashEntry {
  currency: Currency;
  amount: number;
  note: string;
}

interface AddInitialCashModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveAll: (entries: PendingCashEntry[]) => Promise<void>;
}

function CurrencyPickerModal({
  visible,
  current,
  onSelect,
  onClose,
}: {
  visible: boolean;
  current: Currency;
  onSelect: (c: Currency) => void;
  onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [currencySearch, setCurrencySearch] = useState("");
  const { favourites, isFavourite } = useFavouriteCurrencies();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={[addStyles.container, { backgroundColor: colors.background }]}>
        <View style={addStyles.handle}>
          <View style={[addStyles.handleBar, { backgroundColor: colors.border }]} />
        </View>
        <View style={[addStyles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Text style={[addStyles.cancel, { color: colors.mutedForeground }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[addStyles.title, { color: colors.foreground }]}>Select Currency</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={[addStyles.searchBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Feather name="search" size={15} color={colors.mutedForeground} />
          <TextInput
            style={[addStyles.searchInput, { color: colors.foreground }]}
            value={currencySearch}
            onChangeText={setCurrencySearch}
            placeholder="Search currencies…"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {currencySearch.length > 0 && (
            <TouchableOpacity onPress={() => setCurrencySearch("")} hitSlop={8}>
              <Feather name="x" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
          {(() => {
            const q = currencySearch.trim().toLowerCase();
            const filtered = sortWithFavourites([...EXCHANGE_CURRENCIES], favourites).filter((c) => {
              if (!q) return true;
              if (c.toLowerCase().includes(q)) return true;
              return (CURRENCY_NAMES[c] ?? "").toLowerCase().includes(q);
            });
            const favItems = filtered.filter((c) => isFavourite(c));
            const restItems = filtered.filter((c) => !isFavourite(c));
            return (
              <>
                {favItems.length > 0 && (
                  <Text style={[addStyles.sectionLabel, { color: colors.mutedForeground }]}>FAVOURITES</Text>
                )}
                {favItems.map((c) => (
                  <TouchableOpacity
                    key={`fav-${c}`}
                    onPress={() => { onSelect(c as Currency); setCurrencySearch(""); }}
                    style={[addStyles.currencyOption, { borderBottomColor: colors.border, backgroundColor: c === current ? colors.primary + "18" : "transparent" }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[addStyles.currencyOptionText, { color: c === current ? colors.primary : colors.foreground }]}>{c}</Text>
                      <Text style={[addStyles.currencyOptionSub, { color: colors.mutedForeground }]}>{CURRENCY_NAMES[c] ?? ""}</Text>
                    </View>
                    {c === current && <Feather name="check" size={18} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
                {favItems.length > 0 && restItems.length > 0 && (
                  <Text style={[addStyles.sectionLabel, { color: colors.mutedForeground }]}>ALL CURRENCIES</Text>
                )}
                {restItems.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => { onSelect(c as Currency); setCurrencySearch(""); }}
                    style={[addStyles.currencyOption, { borderBottomColor: colors.border, backgroundColor: c === current ? colors.primary + "18" : "transparent" }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[addStyles.currencyOptionText, { color: c === current ? colors.primary : colors.foreground }]}>{c}</Text>
                      <Text style={[addStyles.currencyOptionSub, { color: colors.mutedForeground }]}>{CURRENCY_NAMES[c] ?? ""}</Text>
                    </View>
                    {c === current && <Feather name="check" size={18} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
                {filtered.length === 0 && (
                  <Text style={[addStyles.emptyText, { color: colors.mutedForeground }]}>No currencies match your search.</Text>
                )}
              </>
            );
          })()}
        </ScrollView>
      </View>
    </Modal>
  );
}

function AddInitialCashModal({ visible, onClose, onSaveAll }: AddInitialCashModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [currency, setCurrency] = useState<Currency>("ILS");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [showInlinePicker, setShowInlinePicker] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");
  const [pendingEntries, setPendingEntries] = useState<PendingCashEntry[]>([]);
  const { favourites, isFavourite } = useFavouriteCurrencies();

  const isEntryValid = amount.trim().length > 0 && Number(amount) > 0;
  const canSaveAll = pendingEntries.length > 0;

  function handleAddEntry() {
    if (!isEntryValid) return;
    const newEntry: PendingCashEntry = {
      currency,
      amount: parseFloat(Number(amount).toFixed(2)),
      note: note.trim() || `Cash from Home (${currency})`,
    };
    setPendingEntries((prev) => [...prev, newEntry]);
    setAmount("");
    setNote("");
    setShowInlinePicker(false);
  }

  function handleRemoveEntry(idx: number) {
    setPendingEntries((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSaveAll() {
    const toSave = [...pendingEntries];
    if (isEntryValid) {
      toSave.push({
        currency,
        amount: parseFloat(Number(amount).toFixed(2)),
        note: note.trim() || `Cash from Home (${currency})`,
      });
    }
    if (toSave.length === 0) return;
    setSaving(true);
    try {
      await onSaveAll(toSave);
      setPendingEntries([]);
      setAmount("");
      setNote("");
      setCurrencySearch("");
      setShowInlinePicker(false);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setPendingEntries([]);
    setAmount("");
    setNote("");
    setCurrencySearch("");
    setShowInlinePicker(false);
    onClose();
  }

  const filteredCurrencies = (() => {
    const q = currencySearch.trim().toLowerCase();
    return sortWithFavourites([...EXCHANGE_CURRENCIES], favourites).filter((c) => {
      if (!q) return true;
      if (c.toLowerCase().includes(q)) return true;
      return (CURRENCY_NAMES[c] ?? "").toLowerCase().includes(q);
    });
  })();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={handleClose}>
      <View style={[addStyles.container, { backgroundColor: colors.background }]}>
        <View style={addStyles.handle}>
          <View style={[addStyles.handleBar, { backgroundColor: colors.border }]} />
        </View>
        <View style={[addStyles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose} hitSlop={8}>
            <Text style={[addStyles.cancel, { color: colors.mutedForeground }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[addStyles.title, { color: colors.foreground }]}>Cash from Home</Text>
          <TouchableOpacity
            onPress={handleSaveAll}
            disabled={(!canSaveAll && !isEntryValid) || saving}
            hitSlop={8}
          >
            <Text style={[addStyles.save, { color: (canSaveAll || isEntryValid) && !saving ? colors.primary : colors.mutedForeground }]}>
              {saving ? "Saving…" : "Save All"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={[addStyles.form, { paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
          {pendingEntries.length > 0 && (
            <View style={[addStyles.pendingList, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[addStyles.pendingTitle, { color: colors.mutedForeground }]}>ENTRIES TO SAVE</Text>
              {pendingEntries.map((entry, idx) => (
                <View key={idx} style={[addStyles.pendingRow, { borderTopColor: colors.border }]}>
                  <View style={[addStyles.pendingBadge, { backgroundColor: colors.primary + "18" }]}>
                    <Text style={[addStyles.pendingCurrency, { color: colors.primary }]}>{entry.currency}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[addStyles.pendingAmount, { color: colors.foreground }]}>
                      {entry.amount.toFixed(2)} {entry.currency}
                    </Text>
                    {entry.note ? (
                      <Text style={[addStyles.pendingNote, { color: colors.mutedForeground }]} numberOfLines={1}>{entry.note}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveEntry(idx)} hitSlop={8}>
                    <Feather name="x" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={[addStyles.entryForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[addStyles.entryFormTitle, { color: colors.foreground }]}>
              {pendingEntries.length === 0 ? "Log your starting cash" : "Add another currency"}
            </Text>

            <View style={addStyles.field}>
              <Text style={[addStyles.label, { color: colors.mutedForeground }]}>CURRENCY</Text>
              <TouchableOpacity
                onPress={() => { setShowInlinePicker((v) => !v); setCurrencySearch(""); }}
                style={[addStyles.picker, { backgroundColor: colors.background, borderColor: showInlinePicker ? colors.primary : colors.border }]}
              >
                <Text style={[addStyles.pickerText, { color: colors.foreground }]}>{currency}</Text>
                <Feather name={showInlinePicker ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
              {showInlinePicker && (
                <View style={[addStyles.inlinePicker, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={[addStyles.searchBox, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 0, marginVertical: 8 }]}>
                    <Feather name="search" size={14} color={colors.mutedForeground} />
                    <TextInput
                      style={[addStyles.searchInput, { color: colors.foreground }]}
                      value={currencySearch}
                      onChangeText={setCurrencySearch}
                      placeholder="Search…"
                      placeholderTextColor={colors.mutedForeground}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {currencySearch.length > 0 && (
                      <TouchableOpacity onPress={() => setCurrencySearch("")} hitSlop={8}>
                        <Feather name="x" size={14} color={colors.mutedForeground} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <ScrollView style={{ maxHeight: 200 }} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                    {filteredCurrencies.map((c) => (
                      <TouchableOpacity
                        key={c}
                        onPress={() => { setCurrency(c as Currency); setShowInlinePicker(false); setCurrencySearch(""); }}
                        style={[addStyles.inlinePickerOption, { borderBottomColor: colors.border, backgroundColor: c === currency ? colors.primary + "18" : "transparent" }]}
                      >
                        <Text style={[addStyles.currencyOptionText, { color: c === currency ? colors.primary : colors.foreground }]}>{c}</Text>
                        <Text style={[addStyles.currencyOptionSub, { color: colors.mutedForeground }]}>{CURRENCY_NAMES[c] ?? ""}</Text>
                        {c === currency && <Feather name="check" size={16} color={colors.primary} />}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={addStyles.field}>
              <Text style={[addStyles.label, { color: colors.mutedForeground }]}>AMOUNT *</Text>
              <TextInput
                style={[addStyles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={addStyles.field}>
              <Text style={[addStyles.label, { color: colors.mutedForeground }]}>NOTE (optional)</Text>
              <TextInput
                style={[addStyles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                value={note}
                onChangeText={setNote}
                placeholder="e.g. Office advance"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            <TouchableOpacity
              onPress={handleAddEntry}
              disabled={!isEntryValid}
              style={[addStyles.addEntryBtn, { backgroundColor: isEntryValid ? colors.primary + "18" : colors.secondary, borderColor: isEntryValid ? colors.primary : colors.border }]}
            >
              <Feather name="plus" size={16} color={isEntryValid ? colors.primary : colors.mutedForeground} />
              <Text style={[addStyles.addEntryBtnText, { color: isEntryValid ? colors.primary : colors.mutedForeground }]}>
                Add Another Currency
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

interface AddAdjustmentModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (currency: Currency, amount: number, note: string) => Promise<void>;
}

function AddAdjustmentModal({ visible, onClose, onSave }: AddAdjustmentModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [currency, setCurrency] = useState<Currency>("ILS");
  const [amount, setAmount] = useState("");
  const [isNegative, setIsNegative] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");
  const { favourites, isFavourite } = useFavouriteCurrencies();

  const isValid = amount.trim().length > 0 && Number(amount) > 0;

  async function handleSave() {
    if (!isValid) return;
    setSaving(true);
    try {
      const finalAmount = isNegative ? -parseFloat(Number(amount).toFixed(2)) : parseFloat(Number(amount).toFixed(2));
      await onSave(currency, finalAmount, note.trim() || `Manual adjustment`);
      setAmount("");
      setNote("");
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={[addStyles.container, { backgroundColor: colors.background }]}>
        <View style={addStyles.handle}>
          <View style={[addStyles.handleBar, { backgroundColor: colors.border }]} />
        </View>
        <View style={[addStyles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Text style={[addStyles.cancel, { color: colors.mutedForeground }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[addStyles.title, { color: colors.foreground }]}>Manual Adjustment</Text>
          <TouchableOpacity onPress={handleSave} disabled={!isValid || saving} hitSlop={8}>
            <Text style={[addStyles.save, { color: isValid && !saving ? colors.primary : colors.mutedForeground }]}>
              {saving ? "Saving…" : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={[addStyles.form, { paddingBottom: insets.bottom + 24 }]}>
          <View style={addStyles.field}>
            <Text style={[addStyles.label, { color: colors.mutedForeground }]}>TYPE</Text>
            <View style={addStyles.typeRow}>
              <TouchableOpacity
                onPress={() => setIsNegative(false)}
                style={[addStyles.typeOption, { backgroundColor: !isNegative ? colors.success + "33" : colors.card, borderColor: !isNegative ? colors.success : colors.border }]}
              >
                <Feather name="plus" size={16} color={!isNegative ? colors.success : colors.mutedForeground} />
                <Text style={[addStyles.typeOptionText, { color: !isNegative ? colors.success : colors.foreground }]}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsNegative(true)}
                style={[addStyles.typeOption, { backgroundColor: isNegative ? colors.destructive + "22" : colors.card, borderColor: isNegative ? colors.destructive : colors.border }]}
              >
                <Feather name="minus" size={16} color={isNegative ? colors.destructive : colors.mutedForeground} />
                <Text style={[addStyles.typeOptionText, { color: isNegative ? colors.destructive : colors.foreground }]}>Subtract</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={addStyles.field}>
            <Text style={[addStyles.label, { color: colors.mutedForeground }]}>CURRENCY</Text>
            <TouchableOpacity
              onPress={() => setShowCurrencyPicker(true)}
              style={[addStyles.picker, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Text style={[addStyles.pickerText, { color: colors.foreground }]}>{currency}</Text>
              <Feather name="chevron-down" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <View style={addStyles.field}>
            <Text style={[addStyles.label, { color: colors.mutedForeground }]}>AMOUNT *</Text>
            <TextInput
              style={[addStyles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={addStyles.field}>
            <Text style={[addStyles.label, { color: colors.mutedForeground }]}>NOTE (optional)</Text>
            <TextInput
              style={[addStyles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
              value={note}
              onChangeText={setNote}
              placeholder="Reason for adjustment"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>
        </ScrollView>

        <Modal visible={showCurrencyPicker} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setShowCurrencyPicker(false)}>
          <View style={[addStyles.container, { backgroundColor: colors.background }]}>
            <View style={addStyles.handle}>
              <View style={[addStyles.handleBar, { backgroundColor: colors.border }]} />
            </View>
            <View style={[addStyles.header, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => setShowCurrencyPicker(false)} hitSlop={8}>
                <Text style={[addStyles.cancel, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[addStyles.title, { color: colors.foreground }]}>Currency</Text>
              <View style={{ width: 60 }} />
            </View>
            <View style={[addStyles.searchBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Feather name="search" size={15} color={colors.mutedForeground} />
              <TextInput
                style={[addStyles.searchInput, { color: colors.foreground }]}
                value={currencySearch}
                onChangeText={setCurrencySearch}
                placeholder="Search currencies…"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {currencySearch.length > 0 && (
                <TouchableOpacity onPress={() => setCurrencySearch("")} hitSlop={8}>
                  <Feather name="x" size={15} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
              {(() => {
                const q = currencySearch.trim().toLowerCase();
                const filtered = sortWithFavourites([...EXCHANGE_CURRENCIES], favourites).filter((c) => {
                  if (!q) return true;
                  if (c.toLowerCase().includes(q)) return true;
                  return (CURRENCY_NAMES[c] ?? "").toLowerCase().includes(q);
                });
                const favItems = filtered.filter((c) => isFavourite(c));
                const restItems = filtered.filter((c) => !isFavourite(c));
                return (
                  <>
                    {favItems.length > 0 && (
                      <Text style={[addStyles.sectionLabel, { color: colors.mutedForeground }]}>FAVOURITES</Text>
                    )}
                    {favItems.map((c) => (
                      <TouchableOpacity
                        key={`fav-${c}`}
                        onPress={() => { setCurrency(c as Currency); setCurrencySearch(""); setShowCurrencyPicker(false); }}
                        style={[addStyles.currencyOption, { borderBottomColor: colors.border, backgroundColor: c === currency ? colors.primary + "18" : "transparent" }]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[addStyles.currencyOptionText, { color: c === currency ? colors.primary : colors.foreground }]}>{c}</Text>
                          <Text style={[addStyles.currencyOptionSub, { color: colors.mutedForeground }]}>{CURRENCY_NAMES[c] ?? ""}</Text>
                        </View>
                        {c === currency && <Feather name="check" size={18} color={colors.primary} />}
                      </TouchableOpacity>
                    ))}
                    {favItems.length > 0 && restItems.length > 0 && (
                      <Text style={[addStyles.sectionLabel, { color: colors.mutedForeground }]}>ALL CURRENCIES</Text>
                    )}
                    {restItems.map((c) => (
                      <TouchableOpacity
                        key={c}
                        onPress={() => { setCurrency(c as Currency); setCurrencySearch(""); setShowCurrencyPicker(false); }}
                        style={[addStyles.currencyOption, { borderBottomColor: colors.border, backgroundColor: c === currency ? colors.primary + "18" : "transparent" }]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[addStyles.currencyOptionText, { color: c === currency ? colors.primary : colors.foreground }]}>{c}</Text>
                          <Text style={[addStyles.currencyOptionSub, { color: colors.mutedForeground }]}>{CURRENCY_NAMES[c] ?? ""}</Text>
                        </View>
                        {c === currency && <Feather name="check" size={18} color={colors.primary} />}
                      </TouchableOpacity>
                    ))}
                    {filtered.length === 0 && (
                      <Text style={[addStyles.emptyText, { color: colors.mutedForeground }]}>No currencies match your search.</Text>
                    )}
                  </>
                );
              })()}
            </ScrollView>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

export default function CashWalletScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const { cashWalletEntries, refreshCashWallet } = useAppContext();

  const [showInitialModal, setShowInitialModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showLedger, setShowLedger] = useState(false);

  useFocusEffect(useCallback(() => {
    refreshCashWallet();
  }, [refreshCashWallet]));

  const balances: Record<string, number> = {};
  for (const entry of cashWalletEntries) {
    balances[entry.currency] = (balances[entry.currency] ?? 0) + entry.amount;
  }

  const currencies = Object.keys(balances).filter((c) => Math.abs(balances[c] ?? 0) > 0.001);

  async function handleAddInitialAll(entries: PendingCashEntry[]) {
    const now = new Date().toISOString();
    for (const entry of entries) {
      await CashWalletDB.insert({
        currency: entry.currency,
        amount: entry.amount,
        entryType: "initial",
        refId: null,
        refTable: null,
        note: entry.note,
        createdAt: now,
      });
    }
    await refreshCashWallet();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function handleAddAdjustment(currency: Currency, amount: number, note: string) {
    await CashWalletDB.insert({
      currency,
      amount,
      entryType: "manual_adjustment",
      refId: null,
      refTable: null,
      note,
      createdAt: new Date().toISOString(),
    });
    await refreshCashWallet();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function handleClearAll() {
    Alert.alert(
      "Clear Cash Wallet",
      "This will remove all cash wallet entries. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            await CashWalletDB.clearAll();
            await refreshCashWallet();
          },
        },
      ]
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Cash Wallet</Text>
        <TouchableOpacity onPress={handleClearAll} hitSlop={8}>
          <Feather name="trash-2" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Current Balances</Text>
          {currencies.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No cash recorded yet. Log your initial cash to get started.
            </Text>
          ) : (
            currencies.map((c) => {
              const bal = balances[c] ?? 0;
              return (
                <View key={c} style={[styles.balanceRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.balanceCurrency, { color: colors.foreground }]}>{c}</Text>
                  <Text style={[styles.balanceAmount, { color: bal >= 0 ? colors.success : colors.destructive }]}>
                    {bal.toFixed(2)}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={() => setShowInitialModal(true)}
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
          >
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Log Initial Cash</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowAdjustmentModal(true)}
            style={[styles.actionBtnSecondary, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="edit-2" size={16} color={colors.foreground} />
            <Text style={[styles.actionBtnSecondaryText, { color: colors.foreground }]}>Adjustment</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/cash-reconciliation")}
          style={[styles.reconcileBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.reconcileBtnContent}>
            <Feather name="check-square" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.reconcileBtnTitle, { color: colors.foreground }]}>Cash Reconciliation</Text>
              <Text style={[styles.reconcileBtnDesc, { color: colors.mutedForeground }]}>
                Compare expected vs actual cash on hand
              </Text>
            </View>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowLedger(!showLedger)}
          style={[styles.ledgerToggle, { borderColor: colors.border }]}
        >
          <Text style={[styles.ledgerToggleText, { color: colors.primary }]}>
            {showLedger ? "Hide" : "Show"} Transaction Ledger ({cashWalletEntries.length})
          </Text>
          <Feather name={showLedger ? "chevron-up" : "chevron-down"} size={16} color={colors.primary} />
        </TouchableOpacity>

        {showLedger && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {cashWalletEntries.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No transactions yet.</Text>
            ) : (
              [...cashWalletEntries].reverse().map((entry) => (
                <View key={entry.id} style={[styles.ledgerRow, { borderTopColor: colors.border }]}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.ledgerEntryType, { color: colors.foreground }]}>
                      {ENTRY_TYPE_LABELS[entry.entryType] ?? entry.entryType}
                    </Text>
                    {entry.note ? (
                      <Text style={[styles.ledgerNote, { color: colors.mutedForeground }]} numberOfLines={2}>
                        {entry.note}
                      </Text>
                    ) : null}
                    <Text style={[styles.ledgerDate, { color: colors.mutedForeground }]}>
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={[styles.ledgerAmount, { color: entry.amount >= 0 ? colors.success : colors.destructive }]}>
                    {formatAmount(entry.amount, entry.currency)}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <AddInitialCashModal
        visible={showInitialModal}
        onClose={() => setShowInitialModal(false)}
        onSaveAll={handleAddInitialAll}
      />
      <AddAdjustmentModal
        visible={showAdjustmentModal}
        onClose={() => setShowAdjustmentModal(false)}
        onSave={handleAddAdjustment}
      />
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
  content: { padding: 16, gap: 16 },
  section: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  balanceCurrency: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  balanceAmount: { fontSize: 18, fontFamily: "Inter_700Bold" },
  actionRow: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
  },
  actionBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionBtnSecondaryText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  reconcileBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  reconcileBtnContent: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  reconcileBtnTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  reconcileBtnDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  ledgerToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  ledgerToggleText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  ledgerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ledgerEntryType: { fontSize: 14, fontFamily: "Inter_500Medium" },
  ledgerNote: { fontSize: 12, fontFamily: "Inter_400Regular" },
  ledgerDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
  ledgerAmount: { fontSize: 14, fontFamily: "Inter_600SemiBold", paddingTop: 2 },
});

const addStyles = StyleSheet.create({
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
  save: { fontSize: 15, fontFamily: "Inter_600SemiBold", textAlign: "right", width: 60 },
  form: { padding: 16, gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  picker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  pickerText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  currencyOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  currencyOptionText: { fontSize: 16, fontFamily: "Inter_400Regular" },
  currencyOptionSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    padding: 0,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  typeRow: { flexDirection: "row", gap: 8 },
  typeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
  },
  typeOptionText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  pendingList: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  pendingTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
  },
  pendingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  pendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pendingCurrency: { fontSize: 13, fontFamily: "Inter_700Bold" },
  pendingAmount: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  pendingNote: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  entryForm: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 14,
  },
  entryFormTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  addEntryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 2,
  },
  addEntryBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  inlinePicker: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    marginTop: 6,
    overflow: "hidden",
  },
  inlinePickerOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
