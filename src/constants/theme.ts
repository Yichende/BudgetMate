import {
  MD3DarkTheme,
  MD3LightTheme,
  configureFonts,
} from "react-native-paper";

import { Platform } from "react-native";

// 定义符合 MD3Type 的字体配置
const baseFont = {
  fontFamily: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'sans-serif',
  }),
  fontWeight: '400' as const,  // 明确指定为字面量类型
  letterSpacing: 0,
  lineHeight: 20,
  fontSize: 14,
};

const fontConfig = {
  displayLarge: baseFont,
  displayMedium: baseFont,
  displaySmall: baseFont,
  headlineLarge: baseFont,
  headlineMedium: baseFont,
  headlineSmall: baseFont,
  titleLarge: baseFont,
  titleMedium: baseFont,
  titleSmall: baseFont,
  bodyLarge: baseFont,
  bodyMedium: baseFont,
  bodySmall: baseFont,
  labelLarge: baseFont,
  labelMedium: baseFont,
  labelSmall: baseFont,
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#F5D76E",
    background: "#FFFBEA",
    surface: "#FFFFFF",
    text: "#333333",
  },
  fonts: configureFonts({ config: fontConfig, isV3: true })
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#F5D76E",
    background: "#1B1A17",
    surface: "#22211E",
    text: "#F5F5F5",
  },
  fonts: configureFonts({ config: fontConfig, isV3: true }),
};