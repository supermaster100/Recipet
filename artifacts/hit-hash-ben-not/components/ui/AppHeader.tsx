import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface AppHeaderProps {
  title: string;
  right?: React.ReactNode;
}

export function AppHeader({ title, right }: AppHeaderProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      {right && <View style={styles.right}>{right}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
