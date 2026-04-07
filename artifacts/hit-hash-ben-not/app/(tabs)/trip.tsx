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
import type { Travel } from "@/db/types";
import { useColors } from "@/hooks/useColors";

function TravelCard({
  travel,
  onPress,
}: {
  travel: Travel;
  onPress: () => void;
}) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View
          style={[styles.iconBox, { backgroundColor: colors.primary + "22" }]}
        >
          <Feather name="map" size={18} color={colors.primary} />
        </View>
        <View style={styles.cardInfo}>
          <Text
            style={[styles.cardName, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {travel.name || "Untitled Trip"}
          </Text>
          {travel.purpose ? (
            <Text
              style={[styles.cardPurpose, { color: colors.mutedForeground }]}
              numberOfLines={1}
            >
              {travel.purpose}
            </Text>
          ) : null}
        </View>
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      </View>
      <View
        style={[styles.cardDates, { borderTopColor: colors.border }]}
      >
        <View style={styles.dateItem}>
          <Feather name="log-in" size={13} color={colors.mutedForeground} />
          <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
            {travel.startDate}
          </Text>
        </View>
        <View style={styles.dateSep}>
          <View style={[styles.dateLine, { backgroundColor: colors.border }]} />
        </View>
        <View style={styles.dateItem}>
          <Feather name="log-out" size={13} color={colors.mutedForeground} />
          <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
            {travel.endDate}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function TripScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { travels, isDbReady } = useAppContext();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: topInset }}>
        <AppHeader
          title="Trips"
          right={
            <TouchableOpacity
              onPress={() => router.push("/add-trip")}
              hitSlop={8}
            >
              <Feather name="plus" size={22} color={colors.primary} />
            </TouchableOpacity>
          }
        />
      </View>

      <FlatList
        data={travels}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 100, flexGrow: 1 },
        ]}
        scrollEnabled={travels.length > 0}
        ListEmptyComponent={
          isDbReady ? (
            <EmptyState
              icon="map"
              title="No trips yet"
              subtitle="Create a trip to track your travel legs, hotels, and receipts"
            />
          ) : null
        }
        renderItem={({ item }) => (
          <TravelCard
            travel={item}
            onPress={() => router.push(`/trip/${item.id}`)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: {
    padding: 16,
    gap: 10,
  },
  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
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
  cardName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  cardPurpose: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  cardDates: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dateText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  dateSep: {
    flex: 1,
    paddingHorizontal: 4,
  },
  dateLine: {
    height: 1,
  },
});
