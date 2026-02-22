// HandyGo Brand Colors - Emerald/Teal theme
export const Colors = {
  primary: {
    50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7',
    400: '#34d399', 500: '#10b981', 600: '#059669',
    700: '#047857', 800: '#065f46', 900: '#064e3b',
  },
  teal: { 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488' },
  gray: {
    50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db',
    400: '#9ca3af', 500: '#6b7280', 600: '#4b5563',
    700: '#374151', 800: '#1f2937', 900: '#111827', 950: '#0f172a',
  },
  slate: { 700: '#334155', 800: '#1e293b', 900: '#0f172a' },
  amber: { 400: '#fbbf24', 500: '#f59e0b' },
  blue: { 400: '#60a5fa', 500: '#3b82f6' },
  purple: { 400: '#a78bfa', 500: '#8b5cf6' },
  cyan: { 400: '#22d3ee', 500: '#06b6d4' },
  red: { 400: '#f87171', 500: '#ef4444' },
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  white: '#ffffff',
  black: '#000000',
  category: {
    plumbing: '#3B82F6',
    electrical: '#F59E0B',
    ac: '#06B6D4',
    general: '#8B5CF6',
  },
};

const tintColorLight = Colors.primary[600];
const tintColorDark = Colors.primary[400];

export default {
  light: {
    text: Colors.gray[900], textSecondary: Colors.gray[600],
    background: Colors.white, backgroundSecondary: Colors.gray[50],
    tint: tintColorLight, tabIconDefault: Colors.gray[400],
    tabIconSelected: tintColorLight, border: Colors.gray[200], card: Colors.white,
  },
  dark: {
    text: Colors.gray[50], textSecondary: Colors.gray[400],
    background: Colors.slate[900], backgroundSecondary: Colors.slate[800],
    tint: tintColorDark, tabIconDefault: Colors.gray[600],
    tabIconSelected: tintColorDark, border: Colors.gray[700], card: Colors.slate[800],
  },
};
