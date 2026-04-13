import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const FAVOURITES_KEY = "@currency_favourites";

export function useFavouriteCurrencies() {
  const [favourites, setFavourites] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(FAVOURITES_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setFavourites(parsed);
        } catch {
          // ignore
        }
      }
      setLoaded(true);
    });
  }, []);

  const toggleFavourite = useCallback(async (code: string) => {
    setFavourites((prev) => {
      const next = prev.includes(code)
        ? prev.filter((c) => c !== code)
        : [...prev, code];
      AsyncStorage.setItem(FAVOURITES_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const isFavourite = useCallback(
    (code: string) => favourites.includes(code),
    [favourites]
  );

  return { favourites, isFavourite, toggleFavourite, loaded };
}

export function sortWithFavourites<T extends string>(
  currencies: T[],
  favourites: string[]
): T[] {
  const favSet = new Set(favourites);
  const favs = currencies.filter((c) => favSet.has(c));
  const rest = currencies.filter((c) => !favSet.has(c));
  return [...favs, ...rest];
}
