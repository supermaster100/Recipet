import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppHeader } from "@/components/ui/AppHeader";
import { useColors } from "@/hooks/useColors";

const APP_VERSION = "1.0.0";

function SettingsRow({
  icon,
  label,
  subtitle,
  onPress,
  color,
  destructive,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  subtitle?: string;
  onPress: () => void;
  color?: string;
  destructive?: boolean;
}) {
  const colors = useColors();
  const tint = destructive ? colors.destructive : color ?? colors.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.row,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View
        style={[styles.rowIcon, { backgroundColor: tint + "22" }]}
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
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
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
              { backgroundColor: colors.primary + "22" },
            ]}
          >
            <Feather name="file-text" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.appName, { color: colors.foreground }]}>
            Hit-hash-Ben-not
          </Text>
          <Text
            style={[styles.appVersion, { color: colors.mutedForeground }]}
          >
            Version {APP_VERSION}
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
  const topInset = Platform.OS === "web" ? 67 : insets.top;

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
          DATA
        </Text>
        <View style={styles.group}>
          <SettingsRow
            icon="download"
            label="Export to CSV"
            subtitle="Export all expenses and trips"
            color="#34C759"
            onPress={() => router.push("/export")}
          />
          <SettingsRow
            icon="pie-chart"
            label="Budgets"
            subtitle="Set monthly spending limits"
            color="#FF9500"
            onPress={() => router.push("/budgets")}
          />
        </View>

        <Text
          style={[
            styles.sectionLabel,
            { color: colors.mutedForeground, marginTop: 8 },
          ]}
        >
          APP
        </Text>
        <View style={styles.group}>
          <SettingsRow
            icon="info"
            label="About"
            subtitle={`Version ${APP_VERSION}`}
            onPress={() => setShowAbout(true)}
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
    padding: 16,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  group: {
    gap: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
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
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  appName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  appVersion: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  appDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  divider: {
    width: "100%",
    height: StyleSheet.hairlineWidth,
    marginVertical: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
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
});
