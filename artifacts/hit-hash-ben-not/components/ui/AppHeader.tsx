import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface AppHeaderProps {
  title: string;
  right?: React.ReactNode;
}

export function AppHeader({ title, right }: AppHeaderProps) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          shadowColor: colors.shadowColor,
        },
      ]}
    >
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
