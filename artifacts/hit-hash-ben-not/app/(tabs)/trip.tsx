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
          borderColor: colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: colors.primary + "22" }]}>
          <Feather name="map" size={18} color={colors.primary} />
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
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
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
          title="Trip"
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
  list: {
    padding: 16,
    gap: 10,
    flexGrow: 1,
  },
  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
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
});
