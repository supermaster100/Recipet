import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EXCHANGE_CURRENCIES } from "@/db/types";
import { CURRENCY_NAMES } from "@/db/currencyNames";
import { useFavouriteCurrencies } from "@/hooks/useFavouriteCurrencies";
import { useColors } from "@/hooks/useColors";

export default function CurrencyFavouritesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const { favourites, isFavourite, toggleFavourite } = useFavouriteCurrencies();
  const [search, setSearch] = useState("");

  const q = search.trim().toLowerCase();
  const filtered = EXCHANGE_CURRENCIES.filter((c) => {
    if (!q) return true;
    if (c.toLowerCase().includes(q)) return true;
    const name = CURRENCY_NAMES[c] ?? "";
    return name.toLowerCase().includes(q);
  });

  const favs = filtered.filter((c) => isFavourite(c));
  const rest = filtered.filter((c) => !isFavourite(c));
  const sections: Array<{ type: "header"; title: string } | { type: "item"; code: string }> = [];

  if (favs.length > 0) {
    sections.push({ type: "header", title: "FAVOURITES" });
    favs.forEach((c) => sections.push({ type: "item", code: c }));
  }
  if (rest.length > 0) {
    sections.push({ type: "header", title: favs.length > 0 ? "ALL CURRENCIES" : "CURRENCIES" });
    rest.forEach((c) => sections.push({ type: "item", code: c }));
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Currency Favourites</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          value={search}
          onChangeText={setSearch}
          placeholder="Search currencies…"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.hint, { color: colors.mutedForeground }]}>
        Tap the star to mark currencies as favourites. They will appear at the top of all currency pickers.
      </Text>

      <FlatList
        data={sections}
        keyExtractor={(item, i) =>
          item.type === "header" ? `header-${i}` : item.code
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        renderItem={({ item }) => {
          if (item.type === "header") {
            return (
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                {item.title}
              </Text>
            );
          }
          const code = item.code;
          const name = CURRENCY_NAMES[code] ?? code;
          const fav = isFavourite(code);
          return (
            <TouchableOpacity
              onPress={() => toggleFavourite(code)}
              style={[styles.row, { borderBottomColor: colors.border, backgroundColor: colors.card }]}
              activeOpacity={0.7}
            >
              <View style={styles.rowInfo}>
                <Text style={[styles.code, { color: colors.foreground }]}>{code}</Text>
                <Text style={[styles.name, { color: colors.mutedForeground }]}>{name}</Text>
              </View>
              <Feather
                name={fav ? "star" : "star"}
                size={22}
                color={fav ? colors.warning : colors.border}
              />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.mutedForeground }]}>
            No currencies match your search.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 16,
    marginBottom: 4,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    padding: 0,
  },
  hint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginHorizontal: 20,
    marginBottom: 12,
    lineHeight: 17,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowInfo: { flex: 1, gap: 2 },
  code: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  name: { fontSize: 13, fontFamily: "Inter_400Regular" },
  empty: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
