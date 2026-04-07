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
import { CostCenterDB } from "@/db/database";
import { useAppContext } from "@/context/AppContext";
import type { CostCenter } from "@/db/types";
import { useColors } from "@/hooks/useColors";

function CostCenterRow({
  costCenter,
  onDelete,
}: {
  costCenter: CostCenter;
  onDelete: () => void;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.rowContent}>
        <Text style={[styles.rowName, { color: colors.foreground }]}>
          {costCenter.name}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onDelete}
        hitSlop={8}
        style={[styles.deleteBtn, { backgroundColor: colors.destructive + "18" }]}
      >
        <Feather name="trash-2" size={15} color={colors.destructive} />
      </TouchableOpacity>
    </View>
  );
}

function AddCostCenterModal({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (name: string) => Promise<void>;
}) {
  const colors = useColors();
  const [name, setName] = useState("");
  const [nameErr, setNameErr] = useState("");
  const [saving, setSaving] = useState(false);

  function reset() {
    setName("");
    setNameErr("");
    setSaving(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleAdd() {
    if (!name.trim()) {
      setNameErr("Cost center name is required");
      return;
    }
    setNameErr("");
    setSaving(true);
    try {
      await onAdd(name.trim());
      reset();
      onClose();
    } catch {
      Alert.alert("Error", "Failed to save cost center.");
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
              Add Cost Center
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
                Name <Text style={{ color: colors.destructive }}>*</Text>
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

export default function CostCentersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { costCenters, refreshCostCenters } = useAppContext();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const [showAdd, setShowAdd] = useState(false);

  async function handleDelete(id: number) {
    Alert.alert("Delete Cost Center", "Remove this cost center?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await CostCenterDB.delete(id);
          await refreshCostCenters();
        },
      },
    ]);
  }

  async function handleClearAll() {
    if (costCenters.length === 0) return;
    Alert.alert("Clear All Cost Centers", "This will permanently remove all cost centers.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All",
        style: "destructive",
        onPress: async () => {
          await Promise.all(costCenters.map((c) => CostCenterDB.delete(c.id)));
          await refreshCostCenters();
        },
      },
    ]);
  }

  async function handleAdd(name: string) {
    await CostCenterDB.insert({ name });
    await refreshCostCenters();
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
          Cost Centers
        </Text>
        <TouchableOpacity
          onPress={() => setShowAdd(true)}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="plus" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {costCenters.length === 0 ? (
        <EmptyState
          icon="layers"
          title="No cost centers yet"
          subtitle="Add cost centers to assign them when recording expenses"
        />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {costCenters.map((c) => (
            <CostCenterRow
              key={c.id}
              costCenter={c}
              onDelete={() => handleDelete(c.id)}
            />
          ))}

          {costCenters.length > 0 && (
            <TouchableOpacity
              onPress={handleClearAll}
              style={[
                styles.clearAllBtn,
                { borderColor: colors.destructive + "60" },
              ]}
            >
              <Feather name="trash" size={14} color={colors.destructive} />
              <Text style={[styles.clearAllText, { color: colors.destructive }]}>
                Clear All Cost Centers
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      <AddCostCenterModal
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
  rowContent: {
    flex: 1,
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
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
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
    width: 60,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  modalSave: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    textAlign: "right",
    width: 60,
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
