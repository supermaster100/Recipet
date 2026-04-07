import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppContext } from "@/context/AppContext";
import { ReceiptDB, ExchangeDB } from "@/db/database";
import { useColors } from "@/hooks/useColors";
import type { TrashItem } from "@/db/types";

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    HOSTING_CLIENTS: "Hosting Clients",
    HOSTING_MYSELF: "Hosting Myself",
    HOSTING_TEAMMATES: "Hosting Teammates",
    HANGING_OUT_CLIENT: "Hanging Out with Client",
    OVERHEAD: "Overhead",
    TAXI: "Taxi",
    TRAIN: "Train",
    FLIGHT: "Flight",
    GIFT: "Gift",
    HOTEL: "Hotel",
    MEALS: "Hosting Myself",
    ACCOMMODATION: "Hotel",
    TRANSPORT: "Taxi",
    OFFICE_SUPPLIES: "Overhead",
    ENTERTAINMENT: "Hanging Out with Client",
    COMMUNICATION: "Overhead",
    OTHER: "Overhead",
    EXCHANGE: "Currency Exchange",
  };
  return map[type] ?? type;
}

function daysUntilExpiry(deleted_at: string): number {
  const deletedMs = new Date(deleted_at).getTime();
  const expiryMs = deletedMs + 90 * 24 * 60 * 60 * 1000;
  const remaining = expiryMs - Date.now();
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
}

function TrashItemRow({ item, onRestore }: { item: TrashItem; onRestore: () => void }) {
  const colors = useColors();
  const days = daysUntilExpiry(item.deleted_at);

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: colors.destructive + "18" }]}>
        <Feather
          name={item.tableSource === "Exchanges" ? "refresh-cw" : "file-text"}
          size={18}
          color={colors.destructive}
        />
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, { color: colors.foreground }]}>
          {typeLabel(item.type)}
        </Text>
        <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
          {item.date} · {item.amount.toFixed(2)} {item.currency}
        </Text>
        <Text
          style={[
            styles.rowExpiry,
            { color: days <= 7 ? colors.destructive : colors.mutedForeground },
          ]}
        >
          {days === 0 ? "Expires today" : `Expires in ${days} day${days === 1 ? "" : "s"}`}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onRestore}
        style={[styles.restoreBtn, { backgroundColor: colors.primary + "18" }]}
        hitSlop={8}
      >
        <Feather name="rotate-ccw" size={16} color={colors.primary} />
        <Text style={[styles.restoreText, { color: colors.primary }]}>Restore</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function TrashScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { trashItems, refreshTrash, refreshReceipts, refreshExchanges } = useAppContext();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const [restoring, setRestoring] = useState<number | null>(null);

  async function handleRestore(item: TrashItem) {
    setRestoring(item.id);
    try {
      if (item.tableSource === "Receipts") {
        await ReceiptDB.restore(item.id);
        await refreshReceipts();
      } else {
        await ExchangeDB.restore(item.id);
        await refreshExchanges();
      }
      await refreshTrash();
    } catch {
      Alert.alert("Error", "Failed to restore item. Please try again.");
    } finally {
      setRestoring(null);
    }
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
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Trash</Text>
        <View style={{ width: 22 }} />
      </View>

      {trashItems.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
            <Feather name="trash-2" size={32} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Trash is empty</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            Deleted items appear here for 90 days before being permanently removed.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Items are permanently deleted after 90 days. Tap Restore to recover an item.
          </Text>
          {trashItems.map((item) => (
            <TrashItemRow
              key={`${item.tableSource}-${item.id}`}
              item={item}
              onRestore={() => {
                if (restoring !== null) return;
                handleRestore(item);
              }}
            />
          ))}
        </ScrollView>
      )}
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
  list: { padding: 16, gap: 8 },
  hint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 8,
    lineHeight: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderBottomWidth: 0,
    overflow: "hidden",
    marginBottom: 8,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 15, fontFamily: "Inter_500Medium" },
  rowSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  rowExpiry: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  restoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  restoreText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold" },
  emptySub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
