import { useColorScheme } from "react-native";

import colors from "@/constants/colors";

type ColorTheme = typeof colors.light;

export function useColors(): ColorTheme & {
  radius: number;
  radiusSm: number;
  radiusMd: number;
  radiusLg: number;
} {
  const scheme = useColorScheme();
  const palette: ColorTheme = scheme === "dark" ? colors.dark : colors.light;
  return {
    ...palette,
    radius: colors.radius,
    radiusSm: colors.radiusSm,
    radiusMd: colors.radiusMd,
    radiusLg: colors.radiusLg,
  };
}
