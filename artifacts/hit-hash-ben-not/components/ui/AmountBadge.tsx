import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface AmountBadgeProps {
  amount: number;
  currency: string;
  size?: "sm" | "md" | "lg";
}

export function AmountBadge({ amount, currency, size = "md" }: AmountBadgeProps) {
  const colors = useColors();

  const fontSize = size === "sm" ? 13 : size === "lg" ? 20 : 16;
  const currencySize = size === "sm" ? 11 : size === "lg" ? 14 : 12;

  return (
    <View style={styles.container}>
      <Text style={[styles.currency, { color: colors.primary, fontSize: currencySize }]}>
        {currency}
      </Text>
      <Text style={[styles.amount, { color: colors.foreground, fontSize }]}>
        {amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
  },
  currency: {
    fontFamily: "Inter_600SemiBold",
  },
  amount: {
    fontFamily: "Inter_700Bold",
  },
});
