import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AmountBadge } from "@/components/ui/AmountBadge";
import { AppHeader } from "@/components/ui/AppHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAppContext } from "@/context/AppContext";
import { RECEIPT_TYPES, type Receipt, type ReceiptType } from "@/db/types";
import { useColors } from "@/hooks/useColors";
import { getPhotoUri } from "@/utils/photoUtils";
import { useFocusEffect, useLocalSearchParams } from "expo-router";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type ViewMode = "day" | "week" | "month" | "range";

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function dateToStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function strToDate(s: string): Date {
  const parts = s.split("-").map(Number);
  if (parts.length === 3 && parts.every((n) => !isNaN(n))) {
    return new Date(parts[0]!, parts[1]! - 1, parts[2]!);
  }
  return new Date();
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function formatDayLabel(dateStr: string): string {
  const d = strToDate(dateStr);
  return `${DAYS_OF_WEEK[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatWeekLabel(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const startStr = `${weekStart.getDate()} ${MONTHS[weekStart.getMonth()]}`;
  const endStr = `${weekEnd.getDate()} ${MONTHS[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;
  return `${startStr} – ${endStr}`;
}

function PhotoThumb({ uri }: { uri: string | null }) {
  const colors = useColors();
  if (uri) {
    return (
      <Image
        source={{ uri: getPhotoUri(uri) }}
        style={styles.thumb}
        contentFit="cover"
      />
    );
  }
  return (
    <View style={[styles.thumb, styles.thumbPlaceholder, { backgroundColor: colors.secondary }]}>
      <Feather name="file-text" size={20} color={colors.mutedForeground} />
    </View>
  );
}

function ExpenseCard({
  expense,
  onPress,
}: {
  expense: Receipt;
  onPress: () => void;
}) {
  const colors = useColors();
  const typeInfo = RECEIPT_TYPES.find((r) => r.key === expense.type);

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
      <PhotoThumb uri={expense.photo} />
      <View style={styles.cardContent}>
        <View style={styles.cardRow}>
          <Text
            style={[styles.cardType, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {typeInfo?.label ?? expense.type}
          </Text>
          <AmountBadge amount={expense.amount} currency={expense.currency} size="sm" />
        </View>
        <View style={styles.cardRow}>
          <Text style={[styles.cardDate, { color: colors.mutedForeground }]}>
            {expense.date}
          </Text>
          {expense.selfDeclaration && (
            <View style={[styles.selfDeclBadge, { backgroundColor: colors.warning + "28" }]}>
              <Text style={[styles.selfDeclText, { color: colors.warning }]}>Self Decl.</Text>
            </View>
          )}
          {!expense.photo && (
            <View style={[styles.noPhotoBadge, { backgroundColor: colors.muted }]}>
              <Feather name="image" size={10} color={colors.mutedForeground} />
              <Text style={[styles.noPhotoText, { color: colors.mutedForeground }]}>No photo</Text>
            </View>
          )}
        </View>
        {expense.note ? (
          <Text style={[styles.cardNote, { color: colors.mutedForeground }]} numberOfLines={1}>
            {expense.note}
          </Text>
        ) : null}
      </View>
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

function SummaryStatCard({
  icon,
  label,
  value,
  subValue,
  color,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  subValue?: string;
  color: string;
  onPress?: () => void;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      style={[styles.statCard, { backgroundColor: colors.card, shadowColor: colors.shadowColor }]}
    >
      <View style={[styles.statCardIcon, { backgroundColor: color + "18" }]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.statCardLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.statCardValue, { color: colors.foreground }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {subValue ? (
        <Text style={[styles.statCardSub, { color: colors.mutedForeground }]} numberOfLines={1}>
          {subValue}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

function ActiveTripCard({ legs }: { legs: import("@/db/types").Leg[] }) {
  const colors = useColors();
  const activeLeg = useMemo(() => {
    return legs.find((l) => !l.deleted_at) ?? null;
  }, [legs]);

  if (!activeLeg) return null;

  const tripId = activeLeg.id;
  const from = activeLeg.departureCity || activeLeg.departureCountry || "—";
  const to = activeLeg.arrivalCity || activeLeg.arrivalCountry || "—";
  const dateRange = activeLeg.departureDate && activeLeg.arrivalDate
    ? `${activeLeg.departureDate} – ${activeLeg.arrivalDate}`
    : activeLeg.departureDate || activeLeg.arrivalDate || "";

  return (
    <View style={[styles.tripCard, { backgroundColor: colors.card, borderColor: colors.primary + "30", shadowColor: colors.shadowColor }]}>
      <View style={styles.tripCardHeader}>
        <View style={[styles.tripCardIconWrap, { backgroundColor: colors.primary + "18" }]}>
          <Feather name="map-pin" size={16} color={colors.primary} />
        </View>
        <Text style={[styles.tripCardTitle, { color: colors.mutedForeground }]}>ACTIVE TRIP</Text>
      </View>
      <View style={styles.tripRoute}>
        <Text style={[styles.tripCity, { color: colors.foreground }]}>{from}</Text>
        <Feather name="arrow-right" size={14} color={colors.mutedForeground} style={{ marginHorizontal: 6 }} />
        <Text style={[styles.tripCity, { color: colors.foreground }]}>{to}</Text>
      </View>
      {dateRange ? (
        <Text style={[styles.tripDates, { color: colors.mutedForeground }]}>{dateRange}</Text>
      ) : null}
      <TouchableOpacity
        onPress={() => router.push({ pathname: "/trip/[id]/summary", params: { id: String(tripId) } })}
        style={[styles.tripSummaryBtn, { backgroundColor: colors.primary + "12" }]}
        activeOpacity={0.75}
      >
        <Text style={[styles.tripSummaryBtnText, { color: colors.primary }]}>View Trip Summary →</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function OverviewScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    receipts, exchanges, atmWithdrawals, cashWalletEntries, legs, isDbReady,
  } = useAppContext();
  const params = useLocalSearchParams<{
    filterCategory?: string;
    filterDateStart?: string;
    filterDateEnd?: string;
  }>();

  const now = new Date();

  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState(dateToStr(now));
  const [selectedWeekStart, setSelectedWeekStart] = useState(dateToStr(getWeekStart(now)));
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<ReceiptType>>(new Set());
  const [showFilter, setShowFilter] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (params.filterCategory) {
        const found = RECEIPT_TYPES.find((rt) => rt.key === params.filterCategory);
        if (found) {
          setActiveFilters(new Set<ReceiptType>([found.key]));
        }
      }
      if (params.filterDateStart && params.filterDateEnd) {
        setRangeStart(params.filterDateStart);
        setRangeEnd(params.filterDateEnd);
        setViewMode("range");
      } else if (params.filterDateStart) {
        setRangeStart(null);
        setRangeEnd(null);
        const parts = params.filterDateStart.split("-");
        const y = parseInt(parts[0] ?? "0", 10);
        const m = parseInt(parts[1] ?? "1", 10);
        if (!isNaN(y) && y > 0) setSelectedYear(y);
        if (!isNaN(m)) setSelectedMonth(m);
        setViewMode("month");
      }
    }, [params.filterCategory, params.filterDateStart, params.filterDateEnd])
  );

  function prevMonth() {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear((y) => y - 1); }
    else { setSelectedMonth((m) => m - 1); }
  }
  function nextMonth() {
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear((y) => y + 1); }
    else { setSelectedMonth((m) => m + 1); }
  }

  function prevDay() {
    const d = strToDate(selectedDay);
    setSelectedDay(dateToStr(addDays(d, -1)));
  }
  function nextDay() {
    const d = strToDate(selectedDay);
    setSelectedDay(dateToStr(addDays(d, 1)));
  }

  function prevWeek() {
    const d = strToDate(selectedWeekStart);
    setSelectedWeekStart(dateToStr(addDays(d, -7)));
  }
  function nextWeek() {
    const d = strToDate(selectedWeekStart);
    setSelectedWeekStart(dateToStr(addDays(d, 7)));
  }

  const periodLabel = useMemo(() => {
    if (viewMode === "day") return formatDayLabel(selectedDay);
    if (viewMode === "week") return formatWeekLabel(strToDate(selectedWeekStart));
    if (viewMode === "range" && rangeStart && rangeEnd) {
      const fmt = (s: string) => {
        const parts = s.split("-");
        if (parts.length !== 3) return s;
        const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        return `${parts[2]} ${months[parseInt(parts[1]!, 10) - 1] ?? ""} ${parts[0]}`;
      };
      return `${fmt(rangeStart)} – ${fmt(rangeEnd)}`;
    }
    return `${MONTHS[selectedMonth - 1]} ${selectedYear}`;
  }, [viewMode, selectedDay, selectedWeekStart, selectedMonth, selectedYear, rangeStart, rangeEnd]);

  const byPeriod = useMemo(() => {
    if (viewMode === "day") {
      return receipts.filter((e) => e.date === selectedDay);
    }
    if (viewMode === "week") {
      const ws = selectedWeekStart;
      const we = dateToStr(addDays(strToDate(ws), 6));
      return receipts.filter((e) => e.date >= ws && e.date <= we);
    }
    if (viewMode === "range" && rangeStart && rangeEnd) {
      return receipts.filter((e) => e.date >= rangeStart && e.date <= rangeEnd);
    }
    const monthStr = String(selectedYear) + "-" + String(selectedMonth).padStart(2, "0");
    return receipts.filter((e) => e.date.startsWith(monthStr));
  }, [receipts, viewMode, selectedDay, selectedWeekStart, selectedMonth, selectedYear, rangeStart, rangeEnd]);

  const filtered = useMemo(() => {
    if (activeFilters.size === 0) return byPeriod;
    return byPeriod.filter((e) => activeFilters.has(e.type));
  }, [byPeriod, activeFilters]);

  const total = useMemo(() => {
    const byCurrency: Record<string, number> = {};
    for (const e of filtered) {
      byCurrency[e.currency] = (byCurrency[e.currency] ?? 0) + e.amount;
    }
    return byCurrency;
  }, [filtered]);

  const exchangesPeriod = useMemo(() => {
    if (viewMode === "day") return exchanges.filter((e) => e.date === selectedDay);
    if (viewMode === "week") {
      const ws = selectedWeekStart;
      const we = dateToStr(addDays(strToDate(ws), 6));
      return exchanges.filter((e) => e.date >= ws && e.date <= we);
    }
    if (viewMode === "range" && rangeStart && rangeEnd) {
      return exchanges.filter((e) => e.date >= rangeStart && e.date <= rangeEnd);
    }
    const monthStr = String(selectedYear) + "-" + String(selectedMonth).padStart(2, "0");
    return exchanges.filter((e) => e.date.startsWith(monthStr));
  }, [exchanges, viewMode, selectedDay, selectedWeekStart, selectedMonth, selectedYear, rangeStart, rangeEnd]);

  const atmPeriod = useMemo(() => {
    if (viewMode === "day") return atmWithdrawals.filter((a) => a.date === selectedDay);
    if (viewMode === "week") {
      const ws = selectedWeekStart;
      const we = dateToStr(addDays(strToDate(ws), 6));
      return atmWithdrawals.filter((a) => a.date >= ws && a.date <= we);
    }
    if (viewMode === "range" && rangeStart && rangeEnd) {
      return atmWithdrawals.filter((a) => a.date >= rangeStart && a.date <= rangeEnd);
    }
    const monthStr = String(selectedYear) + "-" + String(selectedMonth).padStart(2, "0");
    return atmWithdrawals.filter((a) => a.date.startsWith(monthStr));
  }, [atmWithdrawals, viewMode, selectedDay, selectedWeekStart, selectedMonth, selectedYear, rangeStart, rangeEnd]);

  const atmTotalByCurrency = useMemo(() => {
    const byCurrency: Record<string, number> = {};
    for (const a of atmPeriod) {
      byCurrency[a.currency] = (byCurrency[a.currency] ?? 0) + a.amount;
    }
    return byCurrency;
  }, [atmPeriod]);

  const expensesSummaryValue = useMemo(() => {
    const entries = Object.entries(total);
    if (entries.length === 0) return `${byPeriod.length} receipts`;
    if (entries.length === 1) {
      const [cur, amt] = entries[0]!;
      return `${amt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur}`;
    }
    return entries.map(([cur, amt]) => `${amt.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${cur}`).join(" · ");
  }, [total, byPeriod.length]);

  const cashSummaryValue = useMemo(() => {
    const byCurrency: Record<string, number> = {};
    for (const e of cashWalletEntries) {
      byCurrency[e.currency] = (byCurrency[e.currency] ?? 0) + e.amount;
    }
    const entries = Object.entries(byCurrency).slice(0, 2);
    if (entries.length === 0) return "No cash";
    return entries.map(([cur, amt]) => `${amt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur}`).join("\n");
  }, [cashWalletEntries]);

  const atmSummaryValue = useMemo(() => {
    const entries = Object.entries(atmTotalByCurrency);
    if (entries.length === 0) return "0";
    if (entries.length === 1) {
      const [cur, amt] = entries[0]!;
      return `${amt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur}`;
    }
    return entries.map(([cur, amt]) => `${amt.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${cur}`).join(" · ");
  }, [atmTotalByCurrency]);

  function toggleFilter(t: ReceiptType) {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  function handlePrev() {
    if (viewMode === "day") prevDay();
    else if (viewMode === "week") prevWeek();
    else if (viewMode === "month") prevMonth();
  }

  function handleNext() {
    if (viewMode === "day") nextDay();
    else if (viewMode === "week") nextWeek();
    else if (viewMode === "month") nextMonth();
  }

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const hasFilters = activeFilters.size > 0;

  const emptySubtitle = useMemo(() => {
    if (hasFilters) return "Try changing your filters or adding a new receipt";
    if (viewMode === "day") return `No expenses recorded for ${periodLabel}`;
    if (viewMode === "week") return `No expenses recorded for this week`;
    if (viewMode === "range") return `No expenses in this date range`;
    return `No expenses recorded for ${MONTHS[selectedMonth - 1]} ${selectedYear}`;
  }, [hasFilters, viewMode, periodLabel, selectedMonth, selectedYear]);

  const ListHeader = useMemo(() => (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.summaryStrip}
      >
        <SummaryStatCard
          icon="file-text"
          label="Expenses"
          value={expensesSummaryValue}
          subValue={`${byPeriod.length} receipt${byPeriod.length !== 1 ? "s" : ""}`}
          color={colors.primary}
        />
        <SummaryStatCard
          icon="dollar-sign"
          label="Cash"
          value={cashSummaryValue}
          color={colors.success}
          onPress={() => router.push("/cash-wallet")}
        />
        <SummaryStatCard
          icon="refresh-cw"
          label="Exchanges"
          value={String(exchangesPeriod.length)}
          subValue={`this ${viewMode}`}
          color={colors.purple}
          onPress={() => router.push("/(tabs)/exchanges")}
        />
        <SummaryStatCard
          icon="credit-card"
          label="ATM"
          value={atmSummaryValue}
          subValue={`${atmPeriod.length} withdrawal${atmPeriod.length !== 1 ? "s" : ""}`}
          color={colors.warning}
          onPress={() => router.push("/(tabs)/exchanges")}
        />
      </ScrollView>

      <ActiveTripCard legs={legs} />

      <View
        style={[
          styles.viewToggleBar,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        {(["day", "week", "month"] as const).map((mode) => (
          <Pressable
            key={mode}
            onPress={() => {
              setRangeStart(null);
              setRangeEnd(null);
              setViewMode(mode);
            }}
            style={[
              styles.viewToggleBtn,
              viewMode === mode && { backgroundColor: colors.primary },
            ]}
          >
            <Text
              style={[
                styles.viewToggleBtnText,
                { color: viewMode === mode ? "#fff" : colors.mutedForeground },
              ]}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Text>
          </Pressable>
        ))}
        {viewMode === "range" && (
          <Pressable
            style={[styles.viewToggleBtn, { backgroundColor: colors.warning, flex: 1.5 }]}
            onPress={() => {
              setRangeStart(null);
              setRangeEnd(null);
              setViewMode("month");
            }}
          >
            <Text style={[styles.viewToggleBtnText, { color: "#fff" }]}>Trip</Text>
          </Pressable>
        )}
      </View>

      <View
        style={[
          styles.monthNav,
          {
            backgroundColor: colors.card,
            shadowColor: colors.shadowColor,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handlePrev}
          hitSlop={12}
          disabled={viewMode === "range"}
          style={[styles.navBtn, { backgroundColor: colors.secondary, opacity: viewMode === "range" ? 0.3 : 1 }]}
        >
          <Feather name="chevron-left" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <Text
          style={[styles.monthLabel, { color: colors.foreground }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {periodLabel}
        </Text>
        <TouchableOpacity
          onPress={handleNext}
          hitSlop={12}
          disabled={viewMode === "range"}
          style={[styles.navBtn, { backgroundColor: colors.secondary, opacity: viewMode === "range" ? 0.3 : 1 }]}
        >
          <Feather name="chevron-right" size={18} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {showFilter && (
        <View style={[styles.filterBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>
            Filter by type:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChips}>
            <Pressable
              onPress={() => setActiveFilters(new Set())}
              style={[
                styles.chip,
                {
                  backgroundColor: !hasFilters ? colors.primary : colors.secondary,
                  borderColor: !hasFilters ? colors.primary : "transparent",
                },
              ]}
            >
              <Text style={[styles.chipText, { color: !hasFilters ? "#fff" : colors.foreground }]}>
                All
              </Text>
            </Pressable>
            {RECEIPT_TYPES.map((rt) => {
              const active = activeFilters.has(rt.key);
              return (
                <Pressable
                  key={rt.key}
                  onPress={() => toggleFilter(rt.key)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.primary : colors.secondary,
                      borderColor: active ? colors.primary : "transparent",
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: active ? "#fff" : colors.foreground }]}>
                    {rt.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {Object.keys(total).length > 0 && (
        <View style={[styles.summary, { backgroundColor: colors.background }]}>
          {Object.entries(total).map(([cur, amt]) => (
            <AmountBadge key={cur} amount={amt} currency={cur} size="lg" />
          ))}
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
            {filtered.length} expense{filtered.length !== 1 ? "s" : ""}
            {hasFilters ? " (filtered)" : ""}
          </Text>
        </View>
      )}
    </View>
  ), [
    expensesSummaryValue, byPeriod.length, cashSummaryValue,
    exchangesPeriod.length, atmSummaryValue, atmPeriod.length,
    legs, viewMode, periodLabel, showFilter, hasFilters,
    activeFilters, filtered.length, total, colors,
    rangeStart, rangeEnd, selectedDay, selectedWeekStart,
  ]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: topInset }}>
        <AppHeader
          title="Overview"
          right={
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => setShowFilter((v) => !v)}
                hitSlop={8}
                style={[
                  styles.filterBtn,
                  {
                    backgroundColor: hasFilters ? colors.primary + "18" : colors.secondary,
                    borderColor: hasFilters ? colors.primary : "transparent",
                  },
                ]}
              >
                <Feather
                  name="filter"
                  size={16}
                  color={hasFilters ? colors.primary : colors.mutedForeground}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/add-expense")}
                hitSlop={8}
                style={[styles.addButton, { backgroundColor: colors.primary }]}
              >
                <Feather name="plus" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          }
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        scrollEnabled
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          isDbReady ? (
            <EmptyState
              icon="file-text"
              title={hasFilters ? "No matching expenses" : "No expenses"}
              subtitle={emptySubtitle}
              actionLabel={!hasFilters ? "Add Receipt" : undefined}
              onAction={!hasFilters ? () => router.push("/add-expense") : undefined}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <ExpenseCard expense={item} onPress={() => router.push(`/edit-expense/${item.id}`)} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  filterBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryStrip: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    flexDirection: "row",
  },
  statCard: {
    width: 130,
    borderRadius: 16,
    padding: 14,
    gap: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  statCardLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  statCardValue: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.2,
  },
  statCardSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  tripCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  tripCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tripCardIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  tripCardTitle: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  tripRoute: {
    flexDirection: "row",
    alignItems: "center",
  },
  tripCity: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  tripDates: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  tripSummaryBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    marginTop: 2,
  },
  tripSummaryBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  filterBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
  },
  filterLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    paddingHorizontal: 20,
  },
  filterChips: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  viewToggleBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  viewToggleBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 7,
    borderRadius: 8,
  },
  viewToggleBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: -0.2,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
    flexWrap: "wrap",
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginLeft: "auto",
  },
  list: {
    padding: 16,
    gap: 10,
    flexGrow: 1,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  thumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  cardType: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  cardDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  cardNote: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  selfDeclBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  selfDeclText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  noPhotoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  noPhotoText: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
});
