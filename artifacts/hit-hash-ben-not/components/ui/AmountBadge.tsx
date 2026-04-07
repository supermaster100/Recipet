import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface AmountBadgeProps {
  amount: number;
  currency: string;
  size?: "sm" | "md" | "lg";
}

export function AmountBadge({ amount, currency, size = "md" }: AmountBadgeProps) {
  const colors = useColors();

  const fontSize = size === "sm" ? 13 : size === "lg" ? 22 : 17;
  const currencySize = size === "sm" ? 10 : size === "lg" ? 13 : 11;
  const paddingH = size === "sm" ? 7 : size === "lg" ? 12 : 9;
  const paddingV = size === "sm" ? 3 : size === "lg" ? 6 : 4;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.accent,
          paddingHorizontal: paddingH,
          paddingVertical: paddingV,
        },
      ]}
    >
      <Text style={[styles.currency, { color: colors.primary, fontSize: currencySize }]}>
        {currency}
      </Text>
      <Text style={[styles.amount, { color: colors.primary, fontSize }]}>
        {amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  currency: {
    fontFamily: "Inter_600SemiBold",
  },
  amount: {
    fontFamily: "Inter_700Bold",
  },
});
