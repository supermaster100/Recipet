import colors from "@/constants/colors";

type ColorTheme = typeof colors.dark;

export function useColors(): ColorTheme & {
  radius: number;
  radiusSm: number;
  radiusMd: number;
  radiusLg: number;
} {
  return {
    ...colors.dark,
    radius: colors.radius,
    radiusSm: colors.radiusSm,
    radiusMd: colors.radiusMd,
    radiusLg: colors.radiusLg,
  };
}
