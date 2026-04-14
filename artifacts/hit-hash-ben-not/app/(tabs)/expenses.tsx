import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
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

import { AppHeader } from "@/components/ui/AppHeader";
import { useAppContext } from "@/context/AppContext";
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

export default function OverviewScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const {
    receipts,
    exchanges,
    atmWithdrawals,
    travels,
    moneyTransfers,
    clientTransfers,
    cashWalletEntries,
    legs,
  } = useAppContext();

  const activeLeg = useMemo(() => {
    return legs.find((l) => !l.deleted_at) ?? null;
  }, [legs]);

  const dateStart = activeLeg?.departureDate ?? "";
  const dateEnd = activeLeg?.arrivalDate ?? "";

  function isInRange(date: string): boolean {
    if (!dateStart || !dateEnd) return true;
    return date >= dateStart && date <= dateEnd;
  }

  const tripReceipts = useMemo(
    () => activeLeg ? receipts.filter((r) => isInRange(r.date)) : receipts,
    [receipts, dateStart, dateEnd, activeLeg]
  );

  const tripExchanges = useMemo(
    () => activeLeg ? exchanges.filter((e) => isInRange(e.date)) : exchanges,
    [exchanges, dateStart, dateEnd, activeLeg]
  );

  const tripAtmWithdrawals = useMemo(
    () => activeLeg ? atmWithdrawals.filter((a) => isInRange(a.date)) : atmWithdrawals,
    [atmWithdrawals, dateStart, dateEnd, activeLeg]
  );

  const tripTravels = useMemo(
    () => activeLeg
      ? travels.filter((t) => {
          const tStart = t.departureDate || "";
          const tEnd = t.returnDate || "";
          return (tStart && isInRange(tStart)) || (tEnd && isInRange(tEnd));
        })
      : travels,
    [travels, dateStart, dateEnd, activeLeg]
  );

  const tripMoneyTransfers = useMemo(
    () => activeLeg ? moneyTransfers.filter((m) => isInRange(m.date)) : moneyTransfers,
    [moneyTransfers, dateStart, dateEnd, activeLeg]
  );

  const tripClientTransfers = useMemo(
    () => activeLeg ? clientTransfers.filter((c) => isInRange(c.date)) : clientTransfers,
    [clientTransfers, dateStart, dateEnd, activeLeg]
  );

  const receiptTotals = useMemo(
    () => sumByCurrency(tripReceipts.map((r) => ({ amount: r.amount, currency: r.currency }))),
    [tripReceipts]
  );

  const atmTotals = useMemo(
    () => sumByCurrency(tripAtmWithdrawals.map((a) => ({ amount: a.amount, currency: a.currency }))),
    [tripAtmWithdrawals]
  );

  const exchangeSpentTotals = useMemo(
    () => sumByCurrency(tripExchanges.map((e) => ({ amount: e.amountSpent, currency: e.spentCurrency }))),
    [tripExchanges]
  );

  const exchangeReceivedTotals = useMemo(
    () => sumByCurrency(tripExchanges.map((e) => ({ amount: e.amountReceived, currency: e.receivedCurrency }))),
    [tripExchanges]
  );

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

  const cashBalances = useMemo(() => {
    const byCurrency: Record<string, number> = {};
    for (const e of cashWalletEntries) {
      byCurrency[e.currency] = (byCurrency[e.currency] ?? 0) + e.amount;
    }
    const result: Record<string, number> = {};
    for (const [cur, amt] of Object.entries(byCurrency)) {
      if (Math.abs(amt) > 0.001) result[cur] = amt;
    }
    return result;
  }, [cashWalletEntries]);

  const cashFromHomeCount = useMemo(
    () => cashWalletEntries.filter((e) => e.entryType === "initial").length,
    [cashWalletEntries]
  );

  const grandTotal = useMemo(() => {
    const all = [
      ...tripReceipts.map((r) => ({ amount: r.amount, currency: r.currency })),
      ...tripAtmWithdrawals.map((a) => ({ amount: a.amount, currency: a.currency })),
      ...tripTravels.filter((t) => t.ratePerNight > 0 && t.nights > 0).map((t) => ({
        amount: t.ratePerNight * t.nights,
        currency: t.currencyPN,
      })),
      ...tripExchanges.map((e) => ({ amount: e.amountSpent, currency: e.spentCurrency })),
      ...tripExchanges.map((e) => ({ amount: e.amountReceived, currency: e.receivedCurrency })),
      ...tripMoneyTransfers.map((m) => ({ amount: m.amount, currency: m.currency })),
      ...tripClientTransfers.map((c) => ({ amount: c.amount, currency: c.currency })),
    ];
    return sumByCurrency(all);
  }, [tripReceipts, tripAtmWithdrawals, tripTravels, tripExchanges, tripMoneyTransfers, tripClientTransfers]);

  const depCity = activeLeg
    ? resolveCityName(activeLeg.departureCountry ?? "", activeLeg.departureCity ?? "")
    : null;
  const depCountry = activeLeg
    ? resolveCountryName(activeLeg.departureCountry ?? "")
    : null;
  const arrCity = activeLeg
    ? resolveCityName(activeLeg.arrivalCountry ?? "", activeLeg.arrivalCity ?? "")
    : null;
  const arrCountry = activeLeg
    ? resolveCountryName(activeLeg.arrivalCountry ?? "")
    : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: topInset }}>
        <AppHeader title="Overview" />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeLeg ? (
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
              {dateStart ? (
                <View style={[styles.metaPill, { backgroundColor: colors.secondary }]}>
                  <Feather name="calendar" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.metaPillText, { color: colors.foreground }]}>
                    {formatDate(dateStart)}
                  </Text>
                </View>
              ) : null}
              {dateStart && dateEnd ? (
                <Text style={[styles.metaDash, { color: colors.mutedForeground }]}>→</Text>
              ) : null}
              {dateEnd ? (
                <View style={[styles.metaPill, { backgroundColor: colors.secondary }]}>
                  <Feather name="calendar" size={13} color={colors.mutedForeground} />
                  <Text style={[styles.metaPillText, { color: colors.foreground }]}>
                    {formatDate(dateEnd)}
                  </Text>
                </View>
              ) : null}
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
          <View style={[styles.noTripCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="map-pin" size={20} color={colors.mutedForeground} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.noTripTitle, { color: colors.foreground }]}>No Active Trip</Text>
              <Text style={[styles.noTripSub, { color: colors.mutedForeground }]}>
                Showing all records. Set up a trip in the Trip tab.
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          onPress={() => router.push("/cash-wallet")}
          style={[styles.cashFromHomeCard, { backgroundColor: colors.success + "12", borderColor: colors.success + "40" }]}
          activeOpacity={0.8}
        >
          <View style={[styles.cashFromHomeIcon, { backgroundColor: colors.success + "22" }]}>
            <Feather name="home" size={20} color={colors.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cashFromHomeTitle, { color: colors.foreground }]}>Cash from Home</Text>
            <Text style={[styles.cashFromHomeSub, { color: colors.mutedForeground }]}>
              {cashFromHomeCount > 0
                ? `${cashFromHomeCount} entr${cashFromHomeCount !== 1 ? "ies" : "y"} logged — tap to add more`
                : "Log starting cash in any currency"}
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.success} />
        </TouchableOpacity>

        <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>CATEGORIES</Text>

        <SectionCard
          title="General Expense"
          icon="file-text"
          iconColor={colors.primary}
          iconBg={colors.accent}
          count={tripReceipts.length}
          countLabel="receipt(s)"
          totals={receiptTotals}
          onPress={() => router.push("/(tabs)/export")}
        />

        <SectionCard
          title="ATM Withdrawal"
          icon="credit-card"
          iconColor={colors.warning}
          iconBg={colors.warning + "22"}
          count={tripAtmWithdrawals.length}
          countLabel="withdrawal(s)"
          totals={atmTotals}
          onPress={() => router.push("/(tabs)/exchanges")}
        />

        <SectionCard
          title="Currency Exchange"
          icon="refresh-cw"
          iconColor={colors.success}
          iconBg={colors.success + "22"}
          count={tripExchanges.length}
          countLabel="exchange(s)"
          onPress={tripExchanges.length > 0 ? () => router.push("/(tabs)/exchanges") : undefined}
        >
          {Object.keys(exchangeSpentTotals).length > 0 && (
            <View style={styles.exchangeBlock}>
              <Text style={[styles.exchangeDir, { color: colors.mutedForeground }]}>Spent</Text>
              <CurrencyList totals={exchangeSpentTotals} />
            </View>
          )}
          {Object.keys(exchangeReceivedTotals).length > 0 && (
            <View style={styles.exchangeBlock}>
              <Text style={[styles.exchangeDir, { color: colors.mutedForeground }]}>Received</Text>
              <CurrencyList totals={exchangeReceivedTotals} />
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
          title="Teammate Transfer"
          icon="send"
          iconColor={colors.primary}
          iconBg={colors.primary + "18"}
          count={tripMoneyTransfers.length}
          countLabel="transfer(s)"
          totals={moneyTransferTotals}
          onPress={() => router.push("/(tabs)/money-transfers")}
        />

        <SectionCard
          title="Client Transfer"
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
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No recorded spending
            </Text>
          )}

          {Object.keys(cashBalances).length > 0 && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <TouchableOpacity
                onPress={() => router.push("/cash-wallet")}
                style={styles.cashRow}
                activeOpacity={0.75}
              >
                <View style={[styles.cashIconWrap, { backgroundColor: colors.success + "22" }]}>
                  <Feather name="dollar-sign" size={14} color={colors.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cashLabel, { color: colors.foreground }]}>Cash on Hand</Text>
                  <View style={styles.cashAmounts}>
                    {Object.entries(cashBalances).map(([cur, amt]) => (
                      <Text key={cur} style={[styles.cashAmount, { color: colors.success }]}>
                        {amt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {cur}
                      </Text>
                    ))}
                  </View>
                </View>
                <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
            </>
          )}

          {Object.keys(cashBalances).length === 0 && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <TouchableOpacity
                onPress={() => router.push("/cash-wallet")}
                style={styles.cashRow}
                activeOpacity={0.75}
              >
                <View style={[styles.cashIconWrap, { backgroundColor: colors.success + "22" }]}>
                  <Feather name="dollar-sign" size={14} color={colors.success} />
                </View>
                <Text style={[styles.cashLabel, { color: colors.mutedForeground }]}>No cash on hand — tap to manage</Text>
                <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
            </>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.grandTotalRow}>
            <Text style={[styles.grandTotalMeta, { color: colors.mutedForeground }]}>
              {tripReceipts.length} expense{tripReceipts.length !== 1 ? "s" : ""}
            </Text>
            <Text style={[styles.grandTotalMeta, { color: colors.mutedForeground }]}>·</Text>
            <Text style={[styles.grandTotalMeta, { color: colors.mutedForeground }]}>
              {totalNights} night{totalNights !== 1 ? "s" : ""}
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
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  tripCountry: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  tripArrowBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  tripMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
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
    fontFamily: "Inter_400Regular",
  },
  noTripCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  noTripTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  noTripSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  groupLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  cashFromHomeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  cashFromHomeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cashFromHomeTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  cashFromHomeSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  sectionCard: {
    borderRadius: 16,
    padding: 14,
    gap: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
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
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  countText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  currencyList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  currencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  currencyCode: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  currencyAmt: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  currencyTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  currencyTagText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  exchangeBlock: {
    gap: 4,
  },
  exchangeDir: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  grandTotalCard: {
    borderRadius: 16,
    padding: 14,
    gap: 10,
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
    fontFamily: "Inter_700Bold",
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  cashRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cashIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cashLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  cashAmounts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 2,
  },
  cashAmount: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  grandTotalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  grandTotalMeta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
