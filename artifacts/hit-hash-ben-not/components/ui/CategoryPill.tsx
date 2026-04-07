import { StyleSheet, Text, View } from "react-native";

import type { ReceiptType } from "@/db/types";
import { RECEIPT_TYPES } from "@/db/types";
import { useColors } from "@/hooks/useColors";

const RECEIPT_TYPE_COLORS: Record<ReceiptType, string> = {
  HOSTING_CLIENTS: "#D97706",
  HOSTING_MYSELF: "#EA580C",
  HOSTING_TEAMMATES: "#B45309",
  HANGING_OUT_CLIENT: "#DB2777",
  OVERHEAD: "#6B7280",
  TAXI: "#16A34A",
  TRAIN: "#0891B2",
  FLIGHT: "#2563EB",
  GIFT: "#7C3AED",
  HOTEL: "#0F766E",
};

interface CategoryPillProps {
  category: ReceiptType;
}

export function CategoryPill({ category }: CategoryPillProps) {
  const colors = useColors();
  const label =
    RECEIPT_TYPES.find((c) => c.key === category)?.label ?? category;
  const color = RECEIPT_TYPE_COLORS[category] ?? colors.mutedForeground;

  return (
    <View style={[styles.pill, { backgroundColor: color + "18" }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

export { RECEIPT_TYPE_COLORS };

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
});
