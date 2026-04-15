import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { useColors } from "@/hooks/useColors";
import { NICHES, type NicheId } from "./niches";

export default function WelcomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const [selected, setSelected] = useState<NicheId | null>(null);

  // Card fills half the grid row: (screen - 2×padding - 1×gap) / 2
  const cardWidth = Math.floor((screenWidth - 48 - 12) / 2);

  function handleContinue() {
    if (!selected) return;
    console.log("Selected niche:", selected);
    router.push({ pathname: "/(auth)/sign-up", params: { niche: selected } });
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 32 },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Hero */}
      <View style={styles.hero}>
        <Feather name="dollar-sign" size={36} color={colors.primary} />
      </View>

      <Text style={[styles.appName, { color: colors.foreground }]}>
        myExpenses
      </Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Built for professionals who track every dollar
      </Text>

      {/* Role picker */}
      <Text style={[styles.roleLabel, { color: colors.mutedForeground }]}>
        CHOOSE YOUR ROLE
      </Text>

      <View style={styles.grid}>
        {NICHES.map((niche) => {
          const isSelected = selected === niche.id;
          return (
            <TouchableOpacity
              key={niche.id}
              activeOpacity={0.75}
              onPress={() => setSelected(niche.id)}
              style={[
                styles.card,
                {
                  width: cardWidth,
                  backgroundColor: isSelected ? colors.accent : colors.card,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={styles.cardEmoji}>{niche.emoji}</Text>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                {niche.title}
              </Text>
              <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>
                {niche.desc}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Actions */}
      <Button
        label="Continue"
        onPress={handleContinue}
        disabled={selected === null}
        style={styles.continueBtn}
      />

      <TouchableOpacity
        onPress={() => router.push("/(auth)/sign-in")}
        hitSlop={8}
        style={styles.signInBtn}
      >
        <Text style={[styles.signInText, { color: colors.primary }]}>
          I already have an account
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    alignItems: "center",
  },
  hero: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  appName: {
    fontSize: 38,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 48,
  },
  roleLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1.2,
    alignSelf: "flex-start",
    marginBottom: 14,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 32,
    width: "100%",
  },
  card: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
  },
  cardEmoji: {
    fontSize: 28,
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
  continueBtn: {
    width: "100%",
    marginBottom: 20,
  },
  signInBtn: {
    paddingVertical: 8,
  },
  signInText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
});
