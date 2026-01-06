// Shared color palette for Poche applications
// These colors are designed to work across React (web) and React Native (mobile)

// Type definitions
export interface BrandColors {
  primary: string
  primaryLight: string
  primaryDark: string
}

export interface BackgroundColors {
  primary: string
  secondary: string
  tertiary: string
}

export interface TextColors {
  primary: string
  secondary: string
  tertiary: string
  quaternary: string
}

export interface BorderColors {
  primary: string
  secondary: string
  focus: string
}

export interface AccentColors {
  terracotta: string
  sand: string
  sage: string
}

export interface SemanticColors {
  success: string
  successLight: string
  warning: string
  warningLight: string
  error: string
  errorLight: string
  info: string
  infoLight: string
}

export interface Colors {
  brand: BrandColors
  background: BackgroundColors
  text: TextColors
  border: BorderColors
  accent: AccentColors
  semantic: SemanticColors
}

export type ColorScheme = 'light' | 'dark'

// Light mode colors (based on webapp index.css)
const lightColors: Colors = {
  // Brand Colors
  brand: {
    primary: '#EF4056',      // Poche Coral
    primaryLight: '#FF6B7A', // Lighter coral for hover states
    primaryDark: '#D62E43',  // Darker coral for active states
  },

  // Background Colors
  background: {
    primary: '#FDF8F5',      // Cream - main background
    secondary: '#F5EBE4',    // Cream Dark - cards, sections
    tertiary: '#FFFBF9',     // Warm White - elevated surfaces
  },

  // Text Colors
  text: {
    primary: '#2D2926',      // Charcoal - main text
    secondary: '#4A4543',    // Charcoal Light - secondary text
    tertiary: '#8B8280',     // Warm Gray - muted text
    quaternary: '#C4BFBC',   // Warm Gray Light - disabled/placeholder
  },

  // Border Colors
  border: {
    primary: '#F5EBE4',      // Default border
    secondary: '#E8D5C4',    // Sand - subtle borders
    focus: '#EF4056',        // Brand color for focus states
  },

  // Accent Colors
  accent: {
    terracotta: '#C75B4A',   // Warm red-brown
    sand: '#E8D5C4',         // Warm beige
    sage: '#A8B5A0',         // Muted green
  },

  // Semantic Colors
  semantic: {
    success: '#4CAF50',      // Green
    successLight: '#E8F5E9', // Light green background
    warning: '#FF9800',      // Orange
    warningLight: '#FFF3E0', // Light orange background
    error: '#D32F2F',        // Red
    errorLight: '#FFEBEE',   // Light red background
    info: '#2196F3',         // Blue
    infoLight: '#E3F2FD',    // Light blue background
  },
}

// Dark mode colors (derived from light mode for consistency)
const darkColors: Colors = {
  // Brand Colors (slightly adjusted for dark mode visibility)
  brand: {
    primary: '#F06B7A',      // Brighter coral for dark backgrounds
    primaryLight: '#FF8A97', // Even lighter for hover
    primaryDark: '#D64D5E',  // Slightly muted for active
  },

  // Background Colors
  background: {
    primary: '#1A1715',      // Deep warm black - main background
    secondary: '#252220',    // Slightly lighter - cards, sections
    tertiary: '#2F2B28',     // Elevated surfaces
  },

  // Text Colors
  text: {
    primary: '#F5F0ED',      // Off-white - main text
    secondary: '#C4BFBC',    // Warm gray - secondary text
    tertiary: '#8B8280',     // Muted text
    quaternary: '#5A5654',   // Disabled/placeholder
  },

  // Border Colors
  border: {
    primary: '#3A3633',      // Default border
    secondary: '#4A4543',    // Subtle borders
    focus: '#F06B7A',        // Brand color for focus states
  },

  // Accent Colors (adjusted for dark mode)
  accent: {
    terracotta: '#D97A6A',   // Lighter terracotta
    sand: '#6B5D52',         // Muted sand
    sage: '#8FA387',         // Adjusted sage
  },

  // Semantic Colors (adjusted for dark mode)
  semantic: {
    success: '#66BB6A',      // Brighter green
    successLight: '#1B2E1C', // Dark green background
    warning: '#FFB74D',      // Brighter orange
    warningLight: '#2E2416', // Dark orange background
    error: '#EF5350',        // Brighter red
    errorLight: '#2E1A1A',   // Dark red background
    info: '#42A5F5',         // Brighter blue
    infoLight: '#1A2433',    // Dark blue background
  },
}

// Export color schemes
export const colors = {
  light: lightColors,
  dark: darkColors,
} as const

// Helper to get colors for a specific scheme
export function getColors(scheme: ColorScheme): Colors {
  return colors[scheme]
}

// Helper to get a specific color value
export function getColor<K extends keyof Colors>(
  scheme: ColorScheme, 
  category: K, 
  key: keyof Colors[K]
): string {
  const schemeColors = colors[scheme]
  const categoryColors = schemeColors[category]
  return categoryColors[key] as string
}
