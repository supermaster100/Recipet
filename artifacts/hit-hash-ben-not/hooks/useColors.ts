import colors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";

type ColorTheme = typeof colors.dark;

export function useColors(): ColorTheme & {
  radius: number;
  radiusSm: number;
  radiusMd: number;
  radiusLg: number;
} {
  const { theme } = useTheme();
  return {
    ...colors[theme],
    radius: colors.radius,
    radiusSm: colors.radiusSm,
    radiusMd: colors.radiusMd,
    radiusLg: colors.radiusLg,
  };
}
