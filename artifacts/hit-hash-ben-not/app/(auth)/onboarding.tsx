import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { CURRENCY_NAMES, matchesCurrencySearch } from "@/db/currencyNames";
import { EXCHANGE_CURRENCIES, type Currency } from "@/db/types";
import { useColors } from "@/hooks/useColors";
import { isValidNiche, NICHES, type NicheId } from "./niches";

const STEP_TITLES = [
  "Confirm your role",
  "Set your home currency",
  "You're ready",
] as const;

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const params = useLocalSearchParams<{ niche?: string }>();
  const initialNiche: NicheId | null = isValidNiche(params.niche)
    ? params.niche
    : null;

  const [step, setStep] = useState(0);
  const [selectedNiche, setSelectedNiche] = useState<NicheId | null>(
    initialNiche,
  );
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(
    null,
  );
  const [currencySearch, setCurrencySearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageHeight, setPageHeight] = useState(0);

  const pagerRef = useRef<ScrollView>(null);

  const cardWidth = Math.floor((screenWidth - 48 - 12) / 2);

  const filteredCurrencies = EXCHANGE_CURRENCIES.filter((code) =>
    matchesCurrencySearch(code, currencySearch),
  );

  const canAdvance =
    (step === 0 && selectedNiche !== null) ||
    (step === 1 && selectedCurrency !== null) ||
    step === 2;

  function goToStep(nextStep: number) {
    setStep(nextStep);
    pagerRef.current?.scrollTo({ x: nextStep * screenWidth, animated: true });
  }

  async function handleNext() {
    if (step < 2) {
      if (!canAdvance) return;
      goToStep(step + 1);
      return;
    }
    // Step 3 — finish onboarding
    setLoading(true);
    try {
      // TODO: update Supabase users table with niche and currency
      // TODO: check for local SQLite data to import
      console.log("Onboarding complete:", selectedNiche, selectedCurrency);
      router.replace("/(tabs)/expenses");
    } finally {
      setLoading(false);
    }
  }

  const selectedNicheOption = NICHES.find((n) => n.id === selectedNiche);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Header: title + step dots ── */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 16,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.stepTitle, { color: colors.foreground }]}>
          {STEP_TITLES[step]}
        </Text>
        <View style={styles.dots}>
          {([0, 1, 2] as const).map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === step ? colors.primary : colors.border,
                },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.stepCount, { color: colors.mutedForeground }]}>
          {step + 1} of 3
        </Text>
      </View>

      {/* ── Pager ── */}
      <View
        style={styles.pagerWrap}
        onLayout={(e) => setPageHeight(e.nativeEvent.layout.height)}
      >
        {pageHeight > 0 && (
          <ScrollView
            ref={pagerRef}
            horizontal
            pagingEnabled
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            bounces={false}
          >
            {/* ── Step 1: Confirm role ── */}
            <View style={{ width: screenWidth, height: pageHeight }}>
              <ScrollView
                contentContainerStyle={styles.stepPadding}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.grid}>
                  {NICHES.map((niche) => {
                    const isSelected = selectedNiche === niche.id;
                    return (
                      <TouchableOpacity
                        key={niche.id}
                        activeOpacity={0.75}
                        onPress={() => setSelectedNiche(niche.id)}
                        style={[
                          styles.card,
                          {
                            width: cardWidth,
                            backgroundColor: isSelected
                              ? colors.accent
                              : colors.card,
                            borderColor: isSelected
                              ? colors.primary
                              : colors.border,
                          },
                        ]}
                      >
                        <Text style={styles.cardEmoji}>{niche.emoji}</Text>
                        <Text
                          style={[
                            styles.cardTitle,
                            { color: colors.foreground },
                          ]}
                        >
                          {niche.title}
                        </Text>
                        <Text
                          style={[
                            styles.cardDesc,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          {niche.desc}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            {/* ── Step 2: Set currency ── */}
            <View style={{ width: screenWidth, height: pageHeight }}>
              <View style={styles.searchContainer}>
                <TextField
                  placeholder="Search by code or name…"
                  value={currencySearch}
                  onChangeText={setCurrencySearch}
                  autoCorrect={false}
                  autoCapitalize="characters"
                />
              </View>
              <FlatList
                data={filteredCurrencies}
                keyExtractor={(item) => item}
                style={styles.currencyList}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item: code }) => {
                  const isSelected = selectedCurrency === code;
                  const name = CURRENCY_NAMES[code] ?? code;
                  return (
                    <TouchableOpacity
                      onPress={() => setSelectedCurrency(code)}
                      activeOpacity={0.7}
                      style={[
                        styles.currencyRow,
                        {
                          borderBottomColor: colors.border,
                          backgroundColor: isSelected
                            ? colors.accent
                            : "transparent",
                        },
                      ]}
                    >
                      <View style={styles.currencyInfo}>
                        <Text
                          style={[
                            styles.currencyCode,
                            { color: colors.foreground },
                          ]}
                        >
                          {code}
                        </Text>
                        <Text
                          style={[
                            styles.currencyName,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          {name}
                        </Text>
                      </View>
                      {isSelected && (
                        <Feather
                          name="check"
                          size={18}
                          color={colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>

            {/* ── Step 3: You're ready ── */}
            <View style={{ width: screenWidth, height: pageHeight }}>
              <ScrollView
                contentContainerStyle={styles.stepPadding}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.readyEmoji}>🎉</Text>
                <Text
                  style={[styles.readyTitle, { color: colors.foreground }]}
                >
                  You're all set!
                </Text>
                <Text
                  style={[
                    styles.readySubtitle,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Here's what we've configured for you:
                </Text>

                <View
                  style={[
                    styles.summaryCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {/* Niche row */}
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryEmoji}>
                      {selectedNicheOption?.emoji ?? "📊"}
                    </Text>
                    <View style={styles.summaryInfo}>
                      <Text
                        style={[
                          styles.summaryLabel,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        ROLE
                      </Text>
                      <Text
                        style={[
                          styles.summaryValue,
                          { color: colors.foreground },
                        ]}
                      >
                        {selectedNicheOption?.title ?? "General"}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.summaryDivider,
                      { backgroundColor: colors.border },
                    ]}
                  />

                  {/* Currency row */}
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryEmoji}>💱</Text>
                    <View style={styles.summaryInfo}>
                      <Text
                        style={[
                          styles.summaryLabel,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        HOME CURRENCY
                      </Text>
                      <Text
                        style={[
                          styles.summaryValue,
                          { color: colors.foreground },
                        ]}
                      >
                        {selectedCurrency
                          ? `${selectedCurrency} — ${CURRENCY_NAMES[selectedCurrency] ?? selectedCurrency}`
                          : "—"}
                      </Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
            </View>
          </ScrollView>
        )}
      </View>

      {/* ── Bottom nav ── */}
      <View
        style={[
          styles.bottomNav,
          {
            paddingBottom: insets.bottom + 16,
            borderTopColor: colors.border,
          },
        ]}
      >
        {step > 0 ? (
          <Button
            label="Back"
            variant="ghost"
            onPress={() => goToStep(step - 1)}
            style={styles.backNavBtn}
          />
        ) : (
          <View style={styles.backNavBtn} />
        )}
        <Button
          label={
            step === 2 ? (loading ? "Starting…" : "Start tracking") : "Next"
          }
          onPress={handleNext}
          disabled={!canAdvance || loading}
          style={styles.nextBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  /* Header */
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  stepTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.4,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  /* Pager */
  pagerWrap: {
    flex: 1,
  },
  /* Step content */
  stepPadding: {
    padding: 24,
  },
  /* Niche grid (step 1) */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
  },
  cardEmoji: {
    fontSize: 26,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  /* Currency picker (step 2) */
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  currencyList: {
    flex: 1,
  },
  currencyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyCode: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  currencyName: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  /* You're ready (step 3) */
  readyEmoji: {
    fontSize: 60,
    textAlign: "center",
    marginBottom: 16,
  },
  readyTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    textAlign: "center",
    marginBottom: 8,
  },
  readySubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 16,
  },
  summaryEmoji: {
    fontSize: 28,
  },
  summaryInfo: {
    flex: 1,
    gap: 3,
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.8,
  },
  summaryValue: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  /* Bottom nav */
  bottomNav: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  backNavBtn: {
    flex: 1,
  },
  nextBtn: {
    flex: 2,
  },
});
