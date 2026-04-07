import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AmountBadge } from "@/components/ui/AmountBadge";
import { CategoryPill } from "@/components/ui/CategoryPill";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAppContext } from "@/context/AppContext";
import { HotelDB, LegDB, TravelDB, TripReceiptDB } from "@/db/database";
import type { Hotel, Leg, Travel, TripReceipt } from "@/db/types";
import { useColors } from "@/hooks/useColors";

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { refreshTravels } = useAppContext();

  const [travel, setTravel] = useState<Travel | null>(null);
  const [legs, setLegs] = useState<Leg[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [receipts, setReceipts] = useState<TripReceipt[]>([]);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  async function load() {
    if (!id) return;
    const travelId = Number(id);
    const [t, l, h, r] = await Promise.all([
      TravelDB.getById(travelId),
      LegDB.getByTravelId(travelId),
      HotelDB.getByTravelId(travelId),
      TripReceiptDB.getByTravelId(travelId),
    ]);
    setTravel(t);
    setLegs(l);
    setHotels(h);
    setReceipts(r);
  }

  useEffect(() => { load(); }, [id]);

  async function handleDelete() {
    Alert.alert("Delete Trip", "Are you sure you want to delete this trip and all its data?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (!id) return;
          await TravelDB.delete(Number(id));
          await refreshTravels();
          router.back();
        },
      },
    ]);
  }

  if (!travel) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState icon="map" title="Trip not found" />
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
        <Text
          style={[styles.headerTitle, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {travel.name}
        </Text>
        <TouchableOpacity onPress={handleDelete} hitSlop={8}>
          <Feather name="trash-2" size={20} color={colors.destructive} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
      >
        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {travel.purpose ? (
            <Text style={[styles.purpose, { color: colors.mutedForeground }]}>
              {travel.purpose}
            </Text>
          ) : null}
          <View style={styles.dates}>
            <Text style={[styles.dateText, { color: colors.foreground }]}>
              {travel.startDate}
            </Text>
            <Feather name="arrow-right" size={14} color={colors.mutedForeground} />
            <Text style={[styles.dateText, { color: colors.foreground }]}>
              {travel.endDate}
            </Text>
          </View>
        </View>

        <Section
          title="Legs"
          icon="navigation"
          onAdd={() => router.push(`/trip/${id}/add-leg`)}
          empty={legs.length === 0}
          emptySubtitle="Add travel legs for this trip"
        >
          {legs.map((leg) => (
            <View
              key={leg.id}
              style={[styles.legCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.legRoute}>
                <View style={styles.legPoint}>
                  <Text style={[styles.legCity, { color: colors.foreground }]}>
                    {leg.departureCity || "—"}
                  </Text>
                  <Text style={[styles.legTime, { color: colors.mutedForeground }]}>
                    {leg.departureDate} {leg.departureHour}
                  </Text>
                </View>
                <View style={styles.legArrow}>
                  <Feather name="arrow-right" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.legTransport, { color: colors.mutedForeground }]}>
                    {leg.transport}
                  </Text>
                </View>
                <View style={[styles.legPoint, { alignItems: "flex-end" }]}>
                  <Text style={[styles.legCity, { color: colors.foreground }]}>
                    {leg.arrivalCity || "—"}
                  </Text>
                  <Text style={[styles.legTime, { color: colors.mutedForeground }]}>
                    {leg.arrivalDate} {leg.arrivalHour}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </Section>

        <Section
          title="Hotels"
          icon="home"
          onAdd={() => router.push(`/trip/${id}/add-hotel`)}
          empty={hotels.length === 0}
          emptySubtitle="Add hotel stays for this trip"
        >
          {hotels.map((h) => (
            <View
              key={h.id}
              style={[styles.hotelCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.hotelTop}>
                <Text style={[styles.hotelName, { color: colors.foreground }]}>
                  {h.hotelName || "Hotel"}
                </Text>
                <AmountBadge amount={h.pricePerNight * h.nights} currency={h.currency} />
              </View>
              <Text style={[styles.hotelDetails, { color: colors.mutedForeground }]}>
                {h.city}, {h.country} · {h.nights} night{h.nights !== 1 ? "s" : ""} · {h.checkIn} → {h.checkOut}
              </Text>
            </View>
          ))}
        </Section>

        <Section
          title="Receipts"
          icon="file-text"
          onAdd={() => router.push(`/trip/${id}/add-receipt`)}
          empty={receipts.length === 0}
          emptySubtitle="Add receipts for this trip"
        >
          {receipts.map((r) => (
            <View
              key={r.id}
              style={[styles.receiptCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.receiptTop}>
                <Text style={[styles.receiptDesc, { color: colors.foreground }]} numberOfLines={1}>
                  {r.description || "—"}
                </Text>
                <AmountBadge amount={r.amount} currency={r.currency} />
              </View>
              <View style={styles.receiptBottom}>
                <CategoryPill category={r.category} />
                <Text style={[styles.receiptDate, { color: colors.mutedForeground }]}>
                  {r.date}
                </Text>
              </View>
            </View>
          ))}
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({
  title,
  icon,
  onAdd,
  empty,
  emptySubtitle,
  children,
}: {
  title: string;
  icon: keyof typeof Feather.glyphMap;
  onAdd: () => void;
  empty: boolean;
  emptySubtitle: string;
  children: React.ReactNode;
}) {
  const colors = useColors();

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitle}>
          <Feather name={icon} size={15} color={colors.primary} />
          <Text style={[styles.sectionTitleText, { color: colors.foreground }]}>
            {title}
          </Text>
        </View>
        <TouchableOpacity onPress={onAdd} hitSlop={8}>
          <Feather name="plus" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>
      {empty ? (
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          {emptySubtitle}
        </Text>
      ) : (
        <View style={styles.sectionContent}>{children}</View>
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
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
  },
  content: {
    padding: 16,
    gap: 20,
  },
  infoCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 6,
  },
  purpose: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  dates: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  section: { gap: 10 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitleText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  sectionContent: { gap: 8 },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    paddingVertical: 8,
  },
  legCard: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  legRoute: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  legPoint: { flex: 1, gap: 2 },
  legArrow: { alignItems: "center", gap: 2, paddingHorizontal: 8 },
  legCity: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  legTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
  legTransport: { fontSize: 10, fontFamily: "Inter_400Regular" },
  hotelCard: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 4,
  },
  hotelTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  hotelName: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },
  hotelDetails: { fontSize: 12, fontFamily: "Inter_400Regular" },
  receiptCard: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 6,
  },
  receiptTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  receiptDesc: { fontSize: 14, fontFamily: "Inter_500Medium", flex: 1 },
  receiptBottom: { flexDirection: "row", alignItems: "center", gap: 8 },
  receiptDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
