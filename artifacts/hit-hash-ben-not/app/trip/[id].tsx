import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
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

import { AmountBadge } from "@/components/ui/AmountBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAppContext } from "@/context/AppContext";
import { LegDB, TravelDB } from "@/db/database";
import type { Leg, Travel } from "@/db/types";
import { useColors } from "@/hooks/useColors";

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { refreshLegs } = useAppContext();

  const [leg, setLeg] = useState<Leg | null>(null);
  const [travels, setTravels] = useState<Travel[]>([]);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  async function load() {
    if (!id) return;
    const legId = Number(id);
    const allTravels = await TravelDB.getAll();
    const legTravels = allTravels.filter((t) => t.lId === legId);
    const allLegs = await LegDB.getAll();
    const currentLeg = allLegs.find((l) => l.id === legId) ?? null;
    setLeg(currentLeg);
    setTravels(legTravels);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleDelete() {
    Alert.alert("Delete Trip", "Are you sure you want to delete this trip and all its segments?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (!id) return;
          for (const t of travels) {
            await TravelDB.delete(t.id);
          }
          await LegDB.delete(Number(id));
          await refreshLegs();
          router.back();
        },
      },
    ]);
  }

  if (!leg) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground, textAlign: "center", marginTop: 100 }}>
          Trip not found
        </Text>
      </View>
    );
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
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
            {leg.type || "Trip"}
          </Text>
          {leg.status ? (
            <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
              {leg.status}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity onPress={handleDelete} hitSlop={8}>
          <Feather name="trash-2" size={20} color={colors.destructive} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Travel Segments
            </Text>
            <TouchableOpacity
              onPress={() => router.push(`/trip/${id}/add-leg`)}
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
            >
              <Feather name="plus" size={14} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Add Segment</Text>
            </TouchableOpacity>
          </View>

          {travels.length === 0 ? (
            <EmptyState
              icon="map-pin"
              title="No travel segments"
              subtitle="Add departure and arrival details"
            />
          ) : (
            travels.map((travel) => (
              <View
                key={travel.id}
                style={[
                  styles.travelCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.routeRow}>
                  <View style={styles.routeCity}>
                    <Text style={[styles.cityName, { color: colors.foreground }]}>
                      {travel.departureCity || travel.departure || "—"}
                    </Text>
                    <Text style={[styles.cityDate, { color: colors.mutedForeground }]}>
                      {travel.departureDate} {travel.departureHour}
                    </Text>
                  </View>
                  <Feather name="arrow-right" size={16} color={colors.mutedForeground} />
                  <View style={[styles.routeCity, styles.routeCityRight]}>
                    <Text style={[styles.cityName, { color: colors.foreground }]}>
                      {travel.arrivalCity || travel.arrival || "—"}
                    </Text>
                    <Text style={[styles.cityDate, { color: colors.mutedForeground }]}>
                      {travel.returnDate} {travel.arrivalHour}
                    </Text>
                  </View>
                </View>
                {travel.placeOfStaying ? (
                  <View
                    style={[
                      styles.hotelRow,
                      { borderTopColor: colors.border },
                    ]}
                  >
                    <Feather name="home" size={13} color={colors.mutedForeground} />
                    <Text style={[styles.hotelText, { color: colors.mutedForeground }]}>
                      {travel.placeOfStaying} — {travel.nights} nights
                    </Text>
                    {travel.ratePerNight > 0 && (
                      <AmountBadge
                        amount={travel.ratePerNight * travel.nights}
                        currency={travel.currencyPN}
                        size="sm"
                      />
                    )}
                  </View>
                ) : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  content: {
    padding: 16,
    gap: 20,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  travelCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    gap: 8,
  },
  routeCity: {
    flex: 1,
    gap: 3,
  },
  routeCityRight: {
    alignItems: "flex-end",
  },
  cityName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  cityDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  hotelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  hotelText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
