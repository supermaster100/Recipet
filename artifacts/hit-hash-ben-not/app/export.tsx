import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { validateExportData, runExport } from "@/utils/exportUtils";
import { useColors } from "@/hooks/useColors";

const EMAIL_KEY = "@export_recipient_email";

function CheckRow({
  label,
  subtitle,
  checked,
  onToggle,
  disabled,
}: {
  label: string;
  subtitle?: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onToggle}
      style={styles.checkRow}
      activeOpacity={disabled ? 1 : 0.7}
      disabled={disabled}
    >
      <View style={[
        styles.checkbox,
        { borderColor: disabled ? colors.mutedForeground + "50" : (checked ? colors.primary : colors.mutedForeground) },
        checked && !disabled && { backgroundColor: colors.primary },
      ]}>
        {checked && <Feather name="check" size={13} color="#fff" />}
      </View>
      <View style={styles.checkText}>
        <Text style={[
          styles.checkLabel,
          { color: disabled ? colors.mutedForeground : colors.foreground },
        ]}>{label}</Text>
        {subtitle && (
          <Text style={[styles.checkSub, { color: colors.mutedForeground }]}>{subtitle}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function ExportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    general, receipts, travels, legs, exchanges,
    atmWithdrawals, moneyTransfers, clientTransfers, cashWalletEntries, costCenters, refreshAll,
  } = useAppContext();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const [recipientEmail, setRecipientEmail] = useState("");
  const [exportAll, setExportAll] = useState(false);
  const [clearAfter, setClearAfter] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState("");

  useEffect(() => {
    AsyncStorage.getItem(EMAIL_KEY).then((v) => { if (v) setRecipientEmail(v); });
  }, []);

  function handleEmailChange(v: string) {
    setRecipientEmail(v);
    AsyncStorage.setItem(EMAIL_KEY, v).catch(() => {});
  }

  const totalItems =
    receipts.length + travels.length + exchanges.length +
    atmWithdrawals.length + moneyTransfers.length + clientTransfers.length;

  function handleYes() {
    if (Platform.OS === "web") {
      window.alert("Not Supported: Email export requires a real device with an email app.");
      return;
    }

    const data = {
      general, legs, travels, receipts,
      exchanges, atmWithdrawals, moneyTransfers, clientTransfers, cashWalletEntries, costCenters,
    };

    const err = validateExportData(data);
    if (err) {
      Alert.alert("Cannot Export", `${err.message}\n\nGo to: ${err.screen}`, [{ text: "OK" }]);
      return;
    }

    doExport(data);
  }

  async function doExport(data: Parameters<typeof runExport>[0]) {
    setRunning(true);
    setProgress("Preparing…");
    try {
      const result = await runExport(data, recipientEmail, clearAfter, true, setProgress);
      if (result === "sent") {
        if (clearAfter) await refreshAll();
        Alert.alert("Export Complete", "Your expense report was sent successfully.");
        router.back();
      } else if (result === "error") {
        Alert.alert("Not Sent", "The email was not sent. No data was changed.");
      }
    } finally {
      setRunning(false);
      setProgress("");
    }
  }

  const canExport = !running && exportAll && receipts.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Export</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Feather name="mail" size={16} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Recipient Email</Text>
          </View>
          <TextInput
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
            value={recipientEmail}
            onChangeText={handleEmailChange}
            placeholder="accountant@company.com"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>Saved automatically. Pre-fills the To: field.</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Feather name="settings" size={16} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Export Options</Text>
          </View>

          <Text style={[styles.summaryText, { color: colors.mutedForeground }]}>
            {totalItems} item{totalItems !== 1 ? "s" : ""} across all categories will be exported to CSV & Excel and attached to an email.
          </Text>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <CheckRow
            label="Export all?"
            subtitle={`${receipts.length} expense${receipts.length !== 1 ? "s" : ""}, ${travels.length} hotel night${travels.length !== 1 ? "s" : ""}, ${exchanges.length} exchange${exchanges.length !== 1 ? "s" : ""}, and more`}
            checked={exportAll}
            onToggle={() => setExportAll((v) => !v)}
          />

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <CheckRow
            label="Clear all trip data after export"
            subtitle="Receipts, hotels, exchanges, ATM & transfers are soft-deleted. General data and cost centers are kept."
            checked={clearAfter}
            onToggle={() => setClearAfter((v) => !v)}
            disabled={!exportAll}
          />
        </View>

        {receipts.length === 0 && !running && (
          <View style={[styles.warningCard, { backgroundColor: colors.destructive + "15", borderColor: colors.destructive + "40" }]}>
            <Feather name="alert-circle" size={15} color={colors.destructive} />
            <Text style={[styles.warningText, { color: colors.destructive }]}>
              At least one expense receipt is required before exporting.
            </Text>
          </View>
        )}

        {running ? (
          <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.progressText, { color: colors.foreground }]}>{progress}</Text>
          </View>
        ) : (
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.cancelBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleYes}
              disabled={!canExport}
              style={[styles.yesBtn, { backgroundColor: canExport ? colors.primary : colors.primary + "50" }]}
              activeOpacity={0.85}
            >
              <Feather name="send" size={16} color="#fff" />
              <Text style={styles.yesBtnText}>Yes, Export</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={[styles.footerHint, { color: colors.mutedForeground }]}>
          Photos are automatically compressed before attaching. Your email app opens so you can review and send.
        </Text>
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
  body: { padding: 16, gap: 16 },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 12,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  cardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  hint: { fontSize: 11, fontFamily: "Inter_400Regular" },
  summaryText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  divider: { height: StyleSheet.hairlineWidth },
  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 2 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkText: { flex: 1, gap: 2 },
  checkLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  checkSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  warningCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  progressCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  progressText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  yesBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 15,
  },
  yesBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  footerHint: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    paddingHorizontal: 8,
  },
});
