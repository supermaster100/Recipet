import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import Constants from "expo-constants";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
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

import { AppHeader } from "@/components/ui/AppHeader";
import { useColors } from "@/hooks/useColors";

const EMAIL_KEY = "@export_recipient_email";

// Version is read from app.json via expo-constants.
// To bump the version, update only the "version" field in app.json — the About popup reflects it automatically.
const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";

function SettingsRow({
  icon,
  label,
  subtitle,
  onPress,
  color,
  destructive,
  isFirst,
  isLast,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  subtitle?: string;
  onPress: () => void;
  color?: string;
  destructive?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  const colors = useColors();
  const tint = destructive ? colors.destructive : color ?? colors.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.row,
        {
          backgroundColor: colors.card,
          borderBottomColor: isLast ? "transparent" : colors.border,
          borderTopLeftRadius: isFirst ? 16 : 0,
          borderTopRightRadius: isFirst ? 16 : 0,
          borderBottomLeftRadius: isLast ? 16 : 0,
          borderBottomRightRadius: isLast ? 16 : 0,
        },
      ]}
    >
      <View
        style={[styles.rowIcon, { backgroundColor: tint + "18" }]}
      >
        <Feather name={icon} size={18} color={tint} />
      </View>
      <View style={styles.rowText}>
        <Text
          style={[
            styles.rowLabel,
            {
              color: destructive ? colors.destructive : colors.foreground,
            },
          ]}
        >
          {label}
        </Text>
        {subtitle && (
          <Text
            style={[styles.rowSubtitle, { color: colors.mutedForeground }]}
          >
            {subtitle}
          </Text>
        )}
      </View>
      <View style={[styles.chevronBox, { backgroundColor: colors.secondary }]}>
        <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
}

function AboutModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useColors();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modal, { backgroundColor: colors.background }]}>
        <View style={styles.modalHandle}>
          <View
            style={[styles.handle, { backgroundColor: colors.border }]}
          />
        </View>
        <View style={styles.modalContent}>
          <View
            style={[
              styles.appIconContainer,
              { backgroundColor: colors.primary + "18" },
            ]}
          >
            <Feather name="file-text" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.appName, { color: colors.foreground }]}>
            Hit-hash-Ben-not app ver. {APP_VERSION}
          </Text>
          <Text
            style={[styles.appDesc, { color: colors.mutedForeground }]}
          >
            A fully offline expense tracker app for managing business expenses,
            trips, hotel nights, and currency exchanges.
          </Text>
          <View
            style={[styles.divider, { backgroundColor: colors.border }]}
          />
          <View
            style={[
              styles.infoCard,
              { backgroundColor: colors.card, shadowColor: colors.shadowColor },
            ]}
          >
            <View style={styles.infoRow}>
              <Text
                style={[styles.infoKey, { color: colors.mutedForeground }]}
              >
                Data storage
              </Text>
              <Text
                style={[styles.infoVal, { color: colors.foreground }]}
              >
                Local (offline only)
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={onClose}
          style={[styles.closeBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.8}
        >
          <Text style={[styles.closeBtnText, { color: colors.primaryForeground }]}>
            Close
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

export default function MoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [showAbout, setShowAbout] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    AsyncStorage.getItem(EMAIL_KEY).then((v) => { if (v) setRecipientEmail(v); });
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: topInset }}>
        <AppHeader title="More" />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          TRANSFERS
        </Text>
        <View style={[styles.group, { shadowColor: colors.shadowColor }]}>
          <SettingsRow
            icon="send"
            label="Money Transfers"
            subtitle="Employee-to-employee cash handoffs"
            color={colors.primary}
            onPress={() => router.push("/(tabs)/money-transfers")}
            isFirst
          />
          <SettingsRow
            icon="users"
            label="Client Transfers"
            subtitle="Employee-to-client cash handoffs"
            color={colors.warning}
            onPress={() => router.push("/(tabs)/client-transfers")}
            isLast
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          DATA
        </Text>
        <View style={[styles.group, { shadowColor: colors.shadowColor }]}>
          <SettingsRow
            icon="user"
            label="General Data"
            subtitle="Worker number, division, cost center"
            color={colors.primary}
            onPress={() => router.push("/general-data")}
            isFirst
          />
          <SettingsRow
            icon="pie-chart"
            label="Budgets"
            subtitle="Manage budget codes"
            color={colors.warning}
            onPress={() => router.push("/budgets")}
          />
          <SettingsRow
            icon="download"
            label="Export to CSV"
            subtitle="Export all expenses and trips"
            color={colors.success}
            onPress={() => router.push("/export")}
          />
          <SettingsRow
            icon="trash-2"
            label="Trash"
            subtitle="Deleted items — 90-day recovery window"
            color={colors.destructive}
            onPress={() => router.push("/trash")}
            isLast
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>
          SETTINGS
        </Text>
        <View style={[styles.group, { shadowColor: colors.shadowColor }]}>
          <View style={[
            styles.emailField,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
            <View style={styles.emailHeader}>
              <View style={[styles.rowIcon, { backgroundColor: colors.primary + "18" }]}>
                <Feather name="mail" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                  Export Recipient Email
                </Text>
                <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>
                  Pre-fills the To: field when exporting
                </Text>
              </View>
            </View>
            <TextInput
              style={[styles.emailInput, { color: colors.foreground, borderColor: colors.border }]}
              value={recipientEmail}
              onChangeText={(v) => {
                setRecipientEmail(v);
                AsyncStorage.setItem(EMAIL_KEY, v).catch(() => {});
              }}
              placeholder="accountant@company.com"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <Text
          style={[
            styles.sectionLabel,
            { color: colors.mutedForeground, marginTop: 8 },
          ]}
        >
          APP
        </Text>
        <View style={[styles.group, { shadowColor: colors.shadowColor }]}>
          <SettingsRow
            icon="info"
            label="About"
            subtitle={`Version ${APP_VERSION}`}
            onPress={() => setShowAbout(true)}
            isFirst
            isLast
          />
        </View>
      </ScrollView>

      <AboutModal visible={showAbout} onClose={() => setShowAbout(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 20,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  group: {
    borderRadius: 16,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  rowSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  chevronBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    flex: 1,
    paddingHorizontal: 24,
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
  modalContent: {
    flex: 1,
    alignItems: "center",
    paddingTop: 40,
    gap: 12,
  },
  appIconContainer: {
    width: 84,
    height: 84,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  appName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  appVersion: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  appDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  divider: {
    width: "100%",
    height: StyleSheet.hairlineWidth,
    marginVertical: 8,
  },
  infoCard: {
    width: "100%",
    borderRadius: 14,
    padding: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoKey: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  infoVal: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  closeBtn: {
    marginBottom: 32,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  emailField: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 12,
  },
  emailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  emailInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
