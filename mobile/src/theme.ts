import { Platform, type ViewStyle } from "react-native";

export const colors = {
  bg: "#0f172a",
  card: "#1e293b",
  border: "#334155",
  cardBorder: "#2d3b4f",
  text: "#f8fafc",
  muted: "#94a3b8",
  accent: "#38bdf8",
  accentMuted: "#0c4a6e",
  danger: "#f87171",
  success: "#4ade80",
};

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
} as const;

export const font = {
  size: {
    title: 22,
    headline: 18,
    body: 16,
    caption: 14,
    label: 12,
  },
  weight: {
    normal: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
} as const;

/** Subtle lift for cards and panels (iOS shadow + Android elevation). */
export const shadowCard: ViewStyle = Platform.select<ViewStyle>({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
  },
  android: { elevation: 3 },
  default: {},
}) ?? {};

/** Tab bar separation from content. */
export const shadowTabBar: ViewStyle = Platform.select<ViewStyle>({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  android: { elevation: 12 },
  default: {},
}) ?? {};
