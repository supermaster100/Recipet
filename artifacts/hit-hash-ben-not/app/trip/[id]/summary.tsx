import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppContext } from "@/context/AppContext";
import { RECEIPT_TYPES } from "@/db/types";
import { useColors } from "@/hooks/useColors";
import { getCities, getCountries } from "@/utils/countriesData";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

const COUNTRIES = getCountries();

function resolveCountryName(code: string) {
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
}

function resolveCityName(countryCode: string, cityCode: string) {
  const cities = getCities(countryCode);
  return cities.find((c) => c.code === cityCode)?.name ?? cityCode;
}

function formatDate(dateStr: string) {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const month = months[parseInt(parts[1]!, 10) - 1] ?? "";
  return `${parts[2]} ${month} ${parts[0]}`;
}

function nightsBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  const diff = e.getTime() - s.getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

function isInRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

function sumByCurrency(items: { amount: number; currency: string }[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of items) {
    result[item.currency] = (result[item.currency] ?? 0) + item.amount;
  }
  return result;
}

function CurrencyList({ totals }: { totals: Record<string, number> }) {
  const colors = useColors();
  const entries = Object.entries(totals);
  if (entries.length === 0) return null;
  return (
    <View style={styles.currencyList}>
      {entries.map(([cur, amt]) => (
        <View key={cur} style={[styles.currencyBadge, { backgroundColor: colors.accent }]}>
          <Text style={[styles.currencyCode, { color: colors.primary }]}>{cur}</Text>
          <Text style={[styles.currencyAmt, { color: colors.primary }]}>
            {amt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
      ))}
    </View>
  );
}

function SectionCard({
  title,
  icon,
  iconColor,
  iconBg,
  count,
  countLabel,
  totals,
  onPress,
  children,
}: {
  title: string;
  icon: FeatherName;
  iconColor: string;
  iconBg: string;
  count?: number;
  countLabel?: string;
  totals?: Record<string, number>;
  onPress?: () => void;
  children?: React.ReactNode;
}) {
  const colors = useColors();
  const inner = (
    <View style={[styles.sectionCard, { backgroundColor: colors.card, shadowColor: colors.shadowColor }]}>
      <View style={styles.sectionCardHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: iconBg }]}>
          <Feather name={icon} size={16} color={iconColor} />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
        {count !== undefined && (
          <View style={[styles.countBadge, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.countText, { color: colors.foreground }]}>
              {count} {countLabel ?? ""}
            </Text>
          </View>
        )}
        {onPress && <Feather name="chevron-right" size={16} color={colors.mutedForeground} />}
      </View>
      {totals && Object.keys(totals).length > 0 && <CurrencyList totals={totals} />}
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        {inner}
      </Pressable>
    );
  }
  return inner;
}

const CATEGORY_ICON_MAP: Record<string, FeatherName> = {
  MEALS: "coffee",
  ACCOMMODATION: "home",
  TRANSPORT: "truck",
  OFFICE_SUPPLIES: "briefcase",
  ENTERTAINMENT: "film",
  COMMUNICATION: "phone",
  OTHER: "package",
};

export default function TripSummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const {
    legs,
    receipts,
    exchanges,
    travels,
    moneyTransfers,
    clientTransfers,
  } = useAppContext();

  const legId = id ? parseInt(id, 10) : null;
  const leg = useMemo(() => legs.find((l) => l.id === legId) ?? null, [legs, legId]);

  const dateStart = leg?.departureDate ?? "";
  const dateEnd = leg?.arrivalDate ?? "";

  const tripReceipts = useMemo(
    () => receipts.filter((r) => isInRange(r.date, dateStart, dateEnd)),
    [receipts, dateStart, dateEnd]
  );

  const tripExchanges = useMemo(
    () => exchanges.filter((e) => isInRange(e.date, dateStart, dateEnd)),
    [exchanges, dateStart, dateEnd]
  );

  const tripTravels = useMemo(
    () => travels.filter((t) => {
      const tStart = t.departureDate || "";
      const tEnd = t.returnDate || "";
      return (tStart && isInRange(tStart, dateStart, dateEnd)) ||
             (tEnd && isInRange(tEnd, dateStart, dateEnd));
    }),
    [travels, dateStart, dateEnd]
  );

  const tripMoneyTransfers = useMemo(
    () => moneyTransfers.filter((m) => isInRange(m.date, dateStart, dateEnd)),
    [moneyTransfers, dateStart, dateEnd]
  );

  const tripClientTransfers = useMemo(
    () => clientTransfers.filter((c) => isInRange(c.date, dateStart, dateEnd)),
    [clientTransfers, dateStart, dateEnd]
  );

  const receiptsByCategory = useMemo(() => {
    const byCat: Record<string, { amount: number; currency: string }[]> = {};
    for (const r of tripReceipts) {
      if (!byCat[r.type]) byCat[r.type] = [];
      byCat[r.type]!.push({ amount: r.amount, currency: r.currency });
    }
    return byCat;
  }, [tripReceipts]);

  const totalNights = useMemo(
    () => tripTravels.reduce((acc, t) => acc + (t.nights ?? 0), 0),
    [tripTravels]
  );

  const hotelTotals = useMemo(() => {
    const raw: { amount: number; currency: string }[] = [];
    for (const t of tripTravels) {
      if (t.ratePerNight > 0 && t.nights > 0) {
        raw.push({ amount: t.ratePerNight * t.nights, currency: t.currencyPN });
      }
    }
    return sumByCurrency(raw);
  }, [tripTravels]);

  const moneyTransferTotals = useMemo(
    () => sumByCurrency(tripMoneyTransfers.map((m) => ({ amount: m.amount, currency: m.currency }))),
    [tripMoneyTransfers]
  );

  const clientTransferTotals = useMemo(
    () => sumByCurrency(tripClientTransfers.map((c) => ({ amount: c.amount, currency: c.currency }))),
    [tripClientTransfers]
  );

  const grandTotal = useMemo(() => {
    const all = [
      ...tripReceipts.map((r) => ({ amount: r.amount, currency: r.currency })),
      ...tripTravels.filter((t) => t.ratePerNight > 0 && t.nights > 0).map((t) => ({
        amount: t.ratePerNight * t.nights,
        currency: t.currencyPN,
      })),
    ];
    return sumByCurrency(all);
  }, [tripReceipts, tripTravels]);

  const depCountry = resolveCountryName(leg?.departureCountry ?? "");
  const depCity = resolveCityName(leg?.departureCountry ?? "", leg?.departureCity ?? "");
  const arrCountry = resolveCountryName(leg?.arrivalCountry ?? "");
  const arrCity = resolveCityName(leg?.arrivalCountry ?? "", leg?.arrivalCity ?? "");

  const exchangeCurrencies = useMemo(() => {
    const set = new Set<string>();
    for (const e of tripExchanges) {
      set.add(e.spentCurrency);
      set.add(e.receivedCurrency);
    }
    return Array.from(set);
  }, [tripExchanges]);

  function navigateToExpensesFiltered(category: string) {
    router.push({
      pathname: "/(tabs)/expenses",
      params: {
        filterCategory: category,
        filterDateStart: dateStart,
        filterDateEnd: dateEnd,
      },
    });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topInset + 8,
            borderBottomColor: colors.border,
            backgroundColor: colors.card,
            shadowColor: colors.shadowColor,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Trip Summary</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {leg ? (
          <View style={[styles.tripHeader, { backgroundColor: colors.card, shadowColor: colors.shadowColor }]}>
            <View style={styles.tripRouteRow}>
              <View style={styles.tripLocation}>
                <Text style={[styles.tripCity, { color: colors.foreground }]}>{depCity}</Text>
                <Text style={[styles.tripCountry, { color: colors.mutedForeground }]}>{depCountry}</Text>
              </View>
              <View style={styles.tripArrowBox}>
                <Feather name="arrow-right" size={18} color={colors.primary} />
              </View>
              <View style={[styles.tripLocation, { alignItems: "flex-end" }]}>
                <Text style={[styles.tripCity, { color: colors.foreground }]}>{arrCity}</Text>
                <Text style={[styles.tripCountry, { color: colors.mutedForeground }]}>{arrCountry}</Text>
              </View>
            </View>
            <View style={styles.tripMeta}>
              <View style={[styles.metaPill, { backgroundColor: colors.secondary }]}>
                <Feather name="calendar" size={13} color={colors.mutedForeground} />
                <Text style={[styles.metaPillText, { color: colors.foreground }]}>
                  {formatDate(dateStart)}
                </Text>
              </View>
              <Text style={[styles.metaDash, { color: colors.mutedForeground }]}>→</Text>
              <View style={[styles.metaPill, { backgroundColor: colors.secondary }]}>
                <Feather name="calendar" size={13} color={colors.mutedForeground} />
                <Text style={[styles.metaPillText, { color: colors.foreground }]}>
                  {formatDate(dateEnd)}
                </Text>
              </View>
              {dateStart && dateEnd && (
                <View style={[styles.metaPill, { backgroundColor: colors.accent }]}>
                  <Feather name="moon" size={13} color={colors.primary} />
                  <Text style={[styles.metaPillText, { color: colors.primary }]}>
                    {nightsBetween(dateStart, dateEnd)} nights
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={[styles.tripHeader, { backgroundColor: colors.card }]}>
            <Text style={[styles.noLegText, { color: colors.mutedForeground }]}>
              Trip not found
            </Text>
          </View>
        )}

        <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>EXPENSES</Text>

        {RECEIPT_TYPES.map((rt) => {
          const items = receiptsByCategory[rt.key] ?? [];
          if (items.length === 0) return null;
          const catTotals = sumByCurrency(items);
          const icon: FeatherName = CATEGORY_ICON_MAP[rt.key] ?? "tag";
          return (
            <SectionCard
              key={rt.key}
              title={rt.label}
              icon={icon}
              iconColor={colors.primary}
              iconBg={colors.accent}
              count={items.length}
              countLabel="receipt(s)"
              totals={catTotals}
              onPress={() => navigateToExpensesFiltered(rt.key)}
            />
          );
        })}

        {tripReceipts.length === 0 && (
          <View style={[styles.emptySection, { backgroundColor: colors.card }]}>
            <Text style={[styles.emptySectionText, { color: colors.mutedForeground }]}>
              No expenses in this trip&apos;s date range
            </Text>
          </View>
        )}

        <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>OTHER RECORDS</Text>

        <SectionCard
          title="Currency Exchanges"
          icon="refresh-cw"
          iconColor={colors.success}
          iconBg={colors.success + "22"}
          count={tripExchanges.length}
          countLabel="exchange(s)"
          onPress={tripExchanges.length > 0 ? () => router.push("/(tabs)/exchanges") : undefined}
        >
          {exchangeCurrencies.length > 0 && (
            <View style={styles.tagRow}>
              {exchangeCurrencies.map((cur) => (
                <View key={cur} style={[styles.currencyTag, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.currencyTagText, { color: colors.foreground }]}>{cur}</Text>
                </View>
              ))}
            </View>
          )}
        </SectionCard>

        <SectionCard
          title="Hotel Nights"
          icon="moon"
          iconColor={colors.purple}
          iconBg={colors.purple + "22"}
          count={totalNights}
          countLabel="night(s)"
          totals={hotelTotals}
          onPress={() => router.push("/(tabs)/trip")}
        />

        <SectionCard
          title="Money Transfers"
          icon="send"
          iconColor={colors.primary}
          iconBg={colors.primary + "18"}
          count={tripMoneyTransfers.length}
          countLabel="transfer(s)"
          totals={moneyTransferTotals}
          onPress={() => router.push("/(tabs)/money-transfers")}
        />

        <SectionCard
          title="Client Transfers"
          icon="users"
          iconColor={colors.warning}
          iconBg={colors.warning + "18"}
          count={tripClientTransfers.length}
          countLabel="transfer(s)"
          totals={clientTransferTotals}
          onPress={() => router.push("/(tabs)/client-transfers")}
        />

        <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>GRAND TOTAL</Text>

        <View style={[styles.grandTotalCard, { backgroundColor: colors.card, shadowColor: colors.shadowColor }]}>
          <View style={styles.grandTotalHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.primary + "22" }]}>
              <Feather name="dollar-sign" size={16} color={colors.primary} />
            </View>
            <Text style={[styles.grandTotalTitle, { color: colors.foreground }]}>
              Total Spending
            </Text>
          </View>
          {Object.keys(grandTotal).length > 0 ? (
            <CurrencyList totals={grandTotal} />
          ) : (
            <Text style={[styles.emptySectionText, { color: colors.mutedForeground }]}>
              No recorded spending
            </Text>
          )}
          <View style={[styles.grandTotalDivider, { backgroundColor: colors.border }]} />
          <View style={styles.grandTotalRow}>
            <Text style={[styles.grandTotalMeta, { color: colors.mutedForeground }]}>
              {tripReceipts.length} expense{tripReceipts.length !== 1 ? "s" : ""}
            </Text>
            <Text style={[styles.grandTotalMeta, { color: colors.mutedForeground }]}>·</Text>
            <Text style={[styles.grandTotalMeta, { color: colors.mutedForeground }]}>
              {totalNights} hotel night{totalNights !== 1 ? "s" : ""}
            </Text>
            <Text style={[styles.grandTotalMeta, { color: colors.mutedForeground }]}>·</Text>
            <Text style={[styles.grandTotalMeta, { color: colors.mutedForeground }]}>
              {tripExchanges.length} exchange{tripExchanges.length !== 1 ? "s" : ""}
            </Text>
          </View>
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.2,
  },
  content: {
    padding: 16,
    gap: 10,
  },
  tripHeader: {
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  tripRouteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tripLocation: {
    flex: 1,
    gap: 2,
  },
  tripCity: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.2,
  },
  tripCountry: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  tripArrowBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tripMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  metaPillText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  metaDash: {
    fontSize: 14,
  },
  noLegText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingVertical: 8,
  },
  groupLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginTop: 6,
    marginBottom: -2,
  },
  sectionCard: {
    borderRadius: 14,
    padding: 14,
    gap: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  countText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  currencyList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  currencyBadge: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currencyCode: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  currencyAmt: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  currencyTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  currencyTagText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  emptySection: {
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  emptySectionText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  grandTotalCard: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  grandTotalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  grandTotalTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  grandTotalDivider: {
    height: StyleSheet.hairlineWidth,
  },
  grandTotalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  grandTotalMeta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
