import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { TextField } from "./TextField";
import { useColors } from "@/hooks/useColors";

interface DateFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function DateField({
  label,
  value,
  onChange,
  placeholder = "YYYY-MM-DD",
}: DateFieldProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          {label.toUpperCase()}
        </Text>
      ) : null}
      <View style={styles.row}>
        <TextField
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          style={styles.input}
          keyboardType="numeric"
        />
        <Pressable
          style={[
            styles.icon,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
          onPress={() => {
            const today = new Date().toISOString().split("T")[0] ?? "";
            if (!value) onChange(today);
          }}
        >
          <Feather name="calendar" size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
  },
  icon: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
