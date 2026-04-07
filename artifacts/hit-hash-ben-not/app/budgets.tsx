import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
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

import { EmptyState } from "@/components/ui/EmptyState";
import { BudgetDB } from "@/db/database";
import { useAppContext } from "@/context/AppContext";
import type { Budget } from "@/db/types";
import { useColors } from "@/hooks/useColors";

function BudgetRow({
  budget,
  selected,
  onToggleSelect,
  onDelete,
}: {
  budget: Budget;
  selected: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onLongPress={onToggleSelect}
      onPress={onToggleSelect}
      style={[
        styles.row,
        {
          backgroundColor: selected ? colors.primary + "18" : colors.card,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.checkCircle,
          {
            backgroundColor: selected ? colors.primary : "transparent",
            borderColor: selected ? colors.primary : colors.border,
          },
        ]}
      >
        {selected && <Feather name="check" size={12} color="#fff" />}
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowNumber, { color: colors.primary }]}>
          #{budget.budgetNumber}
        </Text>
        <Text style={[styles.rowName, { color: colors.foreground }]}>
          {budget.budgetNumberName}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onDelete}
        hitSlop={8}
        style={[styles.deleteBtn, { backgroundColor: colors.destructive + "18" }]}
      >
        <Feather name="trash-2" size={15} color={colors.destructive} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function AddBudgetModal({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (budgetNumber: string, budgetNumberName: string) => Promise<void>;
}) {
  const colors = useColors();
  const [num, setNum] = useState("");
  const [name, setName] = useState("");
  const [numErr, setNumErr] = useState("");
  const [nameErr, setNameErr] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setNum("");
    setName("");
    setNumErr("");
    setNameErr("");
    setSaving(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleAdd() {
    let valid = true;
    if (!num.trim()) {
      setNumErr("Budget number is required");
      valid = false;
    } else if (isNaN(Number(num.trim()))) {
      setNumErr("Must be a number");
      valid = false;
    } else {
      setNumErr("");
    }
    if (!name.trim()) {
      setNameErr("Budget name is required");
      valid = false;
    } else {
      setNameErr("");
    }
    if (!valid) return;

    setSaving(true);
    try {
      await onAdd(num.trim(), name.trim());
      reset();
      onClose();
    } catch {
      Alert.alert("Error", "Failed to save budget.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={styles.modalHandle}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>
          <View
            style={[styles.modalHeader, { borderBottomColor: colors.border }]}
          >
            <TouchableOpacity onPress={handleClose} hitSlop={8}>
              <Text style={[styles.modalCancel, { color: colors.mutedForeground }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Add Budget
            </Text>
            <TouchableOpacity onPress={handleAdd} disabled={saving}>
              <Text
                style={[
                  styles.modalSave,
                  { color: saving ? colors.primary + "80" : colors.primary },
                ]}
              >
                {saving ? "Saving…" : "Add"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>
                Budget Number <Text style={{ color: colors.destructive }}>*</Text>
              </Text>
              <TextInput
                value={num}
                onChangeText={(v) => {
                  setNum(v);
                  if (numErr) setNumErr("");
                }}
                placeholder="e.g. 1001"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: numErr ? colors.destructive : colors.border,
                    color: colors.foreground,
                  },
                ]}
              />
              {numErr ? (
                <Text style={[styles.errorText, { color: colors.destructive }]}>
                  {numErr}
                </Text>
              ) : null}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>
                Budget Name <Text style={{ color: colors.destructive }}>*</Text>
              </Text>
              <TextInput
                value={name}
                onChangeText={(v) => {
                  setName(v);
                  if (nameErr) setNameErr("");
                }}
                placeholder="e.g. Marketing Q1"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="words"
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: nameErr ? colors.destructive : colors.border,
                    color: colors.foreground,
                  },
                ]}
              />
              {nameErr ? (
                <Text style={[styles.errorText, { color: colors.destructive }]}>
                  {nameErr}
                </Text>
              ) : null}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function BudgetsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { budgets, refreshBudgets } = useAppContext();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showAdd, setShowAdd] = useState(false);

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDelete(id: number) {
    Alert.alert("Delete Budget", "Remove this budget?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await BudgetDB.delete(id);
          setSelected((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          await refreshBudgets();
        },
      },
    ]);
  }

  async function handleDeleteSelected() {
    if (selected.size === 0) return;
    Alert.alert(
      "Delete Selected",
      `Remove ${selected.size} budget${selected.size > 1 ? "s" : ""}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await Promise.all([...selected].map((id) => BudgetDB.delete(id)));
            setSelected(new Set());
            await refreshBudgets();
          },
        },
      ]
    );
  }

  async function handleClearAll() {
    if (budgets.length === 0) return;
    Alert.alert("Clear All Budgets", "This will permanently remove all budgets.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All",
        style: "destructive",
        onPress: async () => {
          await Promise.all(budgets.map((b) => BudgetDB.delete(b.id)));
          setSelected(new Set());
          await refreshBudgets();
        },
      },
    ]);
  }

  async function handleAdd(budgetNumber: string, budgetNumberName: string) {
    await BudgetDB.insert({ budgetNumber: Number(budgetNumber), budgetNumberName });
    await refreshBudgets();
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
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Budgets
        </Text>
        <TouchableOpacity
          onPress={() => setShowAdd(true)}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="plus" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {selected.size > 0 && (
        <View
          style={[
            styles.selectionBar,
            { backgroundColor: colors.card, borderBottomColor: colors.border },
          ]}
        >
          <Text style={[styles.selectionCount, { color: colors.foreground }]}>
            {selected.size} selected
          </Text>
          <TouchableOpacity
            onPress={handleDeleteSelected}
            style={[styles.selDeleteBtn, { backgroundColor: colors.destructive }]}
          >
            <Feather name="trash-2" size={14} color="#fff" />
            <Text style={styles.selDeleteText}>Delete Selected</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelected(new Set())}
            hitSlop={8}
          >
            <Feather name="x" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      )}

      {budgets.length === 0 ? (
        <EmptyState
          icon="pie-chart"
          title="No budgets yet"
          subtitle="Add budget codes to use them when recording expenses"
        />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {budgets.map((b) => (
            <BudgetRow
              key={b.id}
              budget={b}
              selected={selected.has(b.id)}
              onToggleSelect={() => toggleSelect(b.id)}
              onDelete={() => handleDelete(b.id)}
            />
          ))}

          {budgets.length > 0 && (
            <TouchableOpacity
              onPress={handleClearAll}
              style={[
                styles.clearAllBtn,
                { borderColor: colors.destructive + "60" },
              ]}
            >
              <Feather name="trash" size={14} color={colors.destructive} />
              <Text style={[styles.clearAllText, { color: colors.destructive }]}>
                Clear All Budgets
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      <AddBudgetModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={handleAdd}
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
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  selectionBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  selectionCount: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  selDeleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  selDeleteText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  list: {
    padding: 16,
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowNumber: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  rowName: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  clearAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 8,
  },
  clearAllText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  modal: {
    flex: 1,
  },
  modalHandle: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalCancel: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  modalSave: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  modalContent: {
    padding: 16,
    gap: 16,
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
  errorText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
