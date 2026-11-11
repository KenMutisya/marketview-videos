import type { Brand } from "../types/brand";

/**
 * MarketView brand configuration.
 *
 * Colours are lifted from the product's own `:root` design tokens; the logo
 * colours are read from the shipped SVG mark, which differs slightly from the
 * UI navy and is the authority for the brand lockup.
 */
export const marketviewBrand: Brand = {
  id: "marketview",
  name: "MarketView",
  tagline: "Africa's trade hubs made visible.",
  website: "marketview.africa",
  cta: "Request access",
  colors: {
    primary: "#1A237E",
    primaryDeep: "#0E1442",
    primaryLift: "#3949AB",
    accent: "#4E917C",
    accentDeep: "#3D7A65",
    logoNavy: "#17235B",
    logoGreen: "#6AA946",
    logoTeal: "#2E6E6B",
    ink: "#1E293B",
    inkSoft: "#475569",
    inkFaint: "#94A3B8",
    surface: "#FFFFFF",
    surfaceSunken: "#F8FAFC",
    border: "#E2E8F0",
    good: "#2E7D32",
    warn: "#B26A00",
    bad: "#C62828",
    info: "#1565C0",
  },
  fontFamily: "InterStudio",
  monoFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  radius: { sm: 6, md: 12, lg: 20, xl: 34 },
  logo: { mark: "assets/logos/marketview-mark.svg" },
  motion: "enterprise",
};
