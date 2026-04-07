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
}: {
  label: string;
  subtitle?: string;
  checked: boolean;
  onToggle: () => void;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity onPress={onToggle} style={styles.checkRow} activeOpacity={0.7}>
      <View style={[
        styles.checkbox,
        { borderColor: checked ? colors.primary : colors.mutedForeground },
        checked && { backgroundColor: colors.primary },
      ]}>
        {checked && <Feather name="check" size={13} color="#fff" />}
      </View>
      <View style={styles.checkText}>
        <Text style={[styles.checkLabel, { color: colors.foreground }]}>{label}</Text>
        {subtitle && <Text style={[styles.checkSub, { color: colors.mutedForeground }]}>{subtitle}</Text>}
      </View>
    </TouchableOpacity>
  );
}

export default function ExportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { general, receipts, travels, legs, exchanges, atmWithdrawals, moneyTransfers, clientTransfers, refreshAll } = useAppContext();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const [recipientEmail, setRecipientEmail] = useState("");
  const [exportAll, setExportAll] = useState(false);
  const [includePhotos] = useState(true);
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

  const totalItems = receipts.length + travels.length + exchanges.length + atmWithdrawals.length;

  function handleExport() {
    if (Platform.OS === "web") {
      Alert.alert("Not Supported", "Email export requires a real device with an email app.");
      return;
    }

    const data = {
      general,
      legs,
      travels,
      receipts,
      exchanges,
      atmWithdrawals,
      moneyTransfers,
      clientTransfers,
    };

    const err = validateExportData(data);
    if (err) {
      Alert.alert(
        "Cannot Export",
        `${err.message}\n\nGo to: ${err.screen}`,
        [{ text: "OK" }]
      );
      return;
    }

    if (clearAfter) {
      Alert.alert(
        "Clear After Export?",
        "After sending the email, all trip data (receipts, hotel nights, exchanges, ATM withdrawals, money/client transfers, and legs) will be permanently cleared. General data and budgets are kept.\n\nContinue?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Continue",
            onPress: () => doExport(data),
          },
        ]
      );
    } else {
      doExport(data);
    }
  }

  async function doExport(data: Parameters<typeof runExport>[0]) {
    setRunning(true);
    setProgress("Preparing…");
    try {
      const result = await runExport(data, recipientEmail, clearAfter, includePhotos, setProgress);
      if (result === "sent") {
        if (clearAfter) await refreshAll();
        Alert.alert("Export Complete", "Your expense report was sent successfully.");
        router.back();
      } else if (result === "cancelled") {
        setProgress("");
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
        contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Feather name="mail" size={16} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recipient Email</Text>
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
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Optional. Saved automatically.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Feather name="package" size={16} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>What to Export</Text>
          </View>
          <CheckRow
            label="Export all?"
            subtitle={`All ${totalItems} item${totalItems !== 1 ? "s" : ""} across every category will be included`}
            checked={exportAll}
            onToggle={() => setExportAll(!exportAll)}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <CheckRow
            label="Clear all trip data after export"
            subtitle="Receipts, hotels, exchanges, transfers. General data and budgets are kept."
            checked={clearAfter}
            onToggle={() => setClearAfter(!clearAfter)}
          />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Feather name="info" size={16} color={colors.mutedForeground} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>What's Included</Text>
          </View>
          {[
            { icon: "file-text" as const, label: "Expenses", count: receipts.length },
            { icon: "map" as const, label: "Hotel Nights", count: travels.length },
            { icon: "repeat" as const, label: "Exchanges", count: exchanges.length },
            { icon: "credit-card" as const, label: "ATM Withdrawals", count: atmWithdrawals.length },
            { icon: "send" as const, label: "Money Transfers", count: moneyTransfers.length },
            { icon: "users" as const, label: "Client Transfers", count: clientTransfers.length },
          ].map(({ icon, label, count }) => (
            <View key={label} style={styles.summaryRow}>
              <Feather name={icon} size={14} color={colors.mutedForeground} />
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{label}</Text>
              <Text style={[styles.summaryCount, { color: count > 0 ? colors.foreground : colors.mutedForeground }]}>
                {count}
              </Text>
            </View>
          ))}
        </View>

        {running ? (
          <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.progressText, { color: colors.foreground }]}>{progress}</Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleExport}
            disabled={!canExport}
            style={[
              styles.exportBtn,
              { backgroundColor: canExport ? colors.primary : colors.primary + "50" },
            ]}
            activeOpacity={0.85}
          >
            <Feather name="send" size={18} color="#fff" />
            <Text style={styles.exportBtnText}>Export & Email</Text>
          </TouchableOpacity>
        )}

        {receipts.length === 0 && !running && (
          <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
            No expenses found. Add at least one expense receipt before exporting.
          </Text>
        )}

        <Text style={[styles.footerHint, { color: colors.mutedForeground }]}>
          Generates a .csv and .xlsx file with all your data. Receipt photos are automatically compressed and attached. Your email app opens for you to review and send.
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
  form: { padding: 16, gap: 16 },
  section: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 12,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  hint: { fontSize: 11, fontFamily: "Inter_400Regular" },
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
  divider: { height: StyleSheet.hairlineWidth },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 3,
  },
  summaryLabel: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  summaryCount: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  progressCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  progressText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 16,
  },
  exportBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  emptyHint: {
    textAlign: "center",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  footerHint: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    paddingHorizontal: 8,
  },
});
