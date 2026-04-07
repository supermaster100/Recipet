import { StyleSheet, Text, View } from "react-native";

import type { ReceiptType } from "@/db/types";
import { RECEIPT_TYPES } from "@/db/types";
import { useColors } from "@/hooks/useColors";

const RECEIPT_TYPE_COLORS: Record<ReceiptType, string> = {
  MEALS: "#D97706",
  ACCOMMODATION: "#7C3AED",
  TRANSPORT: "#16A34A",
  OFFICE_SUPPLIES: "#2563EB",
  ENTERTAINMENT: "#DB2777",
  COMMUNICATION: "#0891B2",
  OTHER: "#6B7280",
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
