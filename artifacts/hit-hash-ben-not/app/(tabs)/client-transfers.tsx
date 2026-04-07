import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppHeader } from "@/components/ui/AppHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAppContext } from "@/context/AppContext";
import type { ClientTransfer } from "@/db/types";
import { useColors } from "@/hooks/useColors";

function ClientTransferCard({
  item,
}: {
  item: ClientTransfer;
}) {
  const colors = useColors();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          shadowColor: colors.shadowColor,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.cardRow}>
        <View style={[styles.iconBox, { backgroundColor: colors.warning + "18" }]}>
          <Feather name="users" size={16} color={colors.warning} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>
            {item.clientName}
          </Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]} numberOfLines={1}>
            From: {item.giverName}
          </Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={[styles.cardAmount, { color: colors.foreground }]}>
            {item.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <Text style={[styles.cardCurrency, { color: colors.mutedForeground }]}>
            {item.currency}
          </Text>
        </View>
      </View>
      <View style={styles.cardMeta}>
        <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
          {item.date}
        </Text>
        {item.photo ? (
          <View style={[styles.photoBadge, { backgroundColor: colors.success + "18" }]}>
            <Feather name="image" size={11} color={colors.success} />
            <Text style={[styles.photoBadgeText, { color: colors.success }]}>Photo</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function ClientTransfersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { clientTransfers, isDbReady } = useAppContext();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: topInset }}>
        <AppHeader
          title="Client Transfers"
          right={
            <TouchableOpacity
              onPress={() => router.push("/add-client-transfer")}
              hitSlop={8}
              style={[styles.addButton, { backgroundColor: colors.warning + "18" }]}
            >
              <Feather name="plus" size={18} color={colors.warning} />
            </TouchableOpacity>
          }
        />
      </View>

      <FlatList
        data={clientTransfers}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 100, flexGrow: 1 },
        ]}
        scrollEnabled={clientTransfers.length > 0}
        ListEmptyComponent={
          isDbReady ? (
            <EmptyState
              icon="users"
              title="No client transfers"
              subtitle="Document employee-to-client cash handoffs with approval note photos"
            />
          ) : null
        }
        renderItem={({ item }) => <ClientTransferCard item={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    padding: 20,
    gap: 10,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  cardSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  cardRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  cardAmount: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  cardCurrency: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.3,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  photoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  photoBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
});
