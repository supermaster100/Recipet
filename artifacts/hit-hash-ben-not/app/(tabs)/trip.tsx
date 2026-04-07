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
import type { Leg } from "@/db/types";
import { useColors } from "@/hooks/useColors";

function LegCard({ leg, onPress }: { leg: Leg; onPress: () => void }) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          shadowColor: colors.shadowColor,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: colors.warning + "18" }]}>
          <Feather name="map" size={18} color={colors.warning} />
        </View>
        <View style={styles.cardInfo}>
          <Text
            style={[styles.cardName, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {leg.type || "Unnamed Trip"}
          </Text>
          {leg.status ? (
            <Text
              style={[styles.cardStatus, { color: colors.mutedForeground }]}
              numberOfLines={1}
            >
              {leg.status}
            </Text>
          ) : null}
        </View>
        <View style={[styles.chevronBox, { backgroundColor: colors.secondary }]}>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </View>
      </View>
    </Pressable>
  );
}

export default function TripScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { legs, isDbReady } = useAppContext();
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
              style={[styles.addButton, { backgroundColor: colors.warning + "18" }]}
            >
              <Feather name="plus" size={18} color={colors.warning} />
            </TouchableOpacity>
          }
        />
      </View>
      <FlatList
        data={legs}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 100 },
        ]}
        scrollEnabled={legs.length > 0}
        ListEmptyComponent={
          isDbReady ? (
            <EmptyState
              icon="map"
              title="No trips yet"
              subtitle="Create a new trip to track your travel expenses"
            />
          ) : null
        }
        renderItem={({ item }) => (
          <LegCard leg={item} onPress={() => router.push(`/trip/${item.id}`)} />
        )}
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
    flexGrow: 1,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    flex: 1,
    gap: 3,
  },
  cardName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  cardStatus: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  chevronBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
