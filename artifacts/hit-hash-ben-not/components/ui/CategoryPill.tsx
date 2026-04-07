import { StyleSheet, Text, View } from "react-native";

import type { ExpenseCategory } from "@/db/types";
import { EXPENSE_CATEGORIES } from "@/db/types";
import { useColors } from "@/hooks/useColors";

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  MEALS: "#FF9500",
  ACCOMMODATION: "#5856D6",
  TRANSPORT: "#34C759",
  OFFICE_SUPPLIES: "#007AFF",
  ENTERTAINMENT: "#FF2D55",
  COMMUNICATION: "#5AC8FA",
  OTHER: "#8E8E93",
};

interface CategoryPillProps {
  category: ExpenseCategory;
}

export function CategoryPill({ category }: CategoryPillProps) {
  const colors = useColors();
  const label =
    EXPENSE_CATEGORIES.find((c) => c.key === category)?.label ?? category;
  const color = CATEGORY_COLORS[category] ?? colors.mutedForeground;

  return (
    <View style={[styles.pill, { backgroundColor: color + "22" }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

export { CATEGORY_COLORS };

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
