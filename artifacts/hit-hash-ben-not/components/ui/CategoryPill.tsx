import { StyleSheet, Text, View } from "react-native";

import type { ReceiptType } from "@/db/types";
import { RECEIPT_TYPES } from "@/db/types";
import { useColors } from "@/hooks/useColors";

const RECEIPT_TYPE_COLORS: Record<ReceiptType, string> = {
  MEALS: "#FF9500",
  ACCOMMODATION: "#5856D6",
  TRANSPORT: "#34C759",
  OFFICE_SUPPLIES: "#007AFF",
  ENTERTAINMENT: "#FF2D55",
  COMMUNICATION: "#5AC8FA",
  OTHER: "#8E8E93",
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
    <View style={[styles.pill, { backgroundColor: color + "22" }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

export { RECEIPT_TYPE_COLORS };

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
});
