import React, { useContext } from 'react';
import {
  MD3DarkTheme,
  MD3LightTheme,
  configureFonts
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
    secondary: "#7A46A8",
    outline: "#E0E0E0",
    income: "#F44336",
    expense: "#4CAF50",
    chipBg: "#f2f2f2",
    chipSelectedBg: "#F7E8FF",
    headerBg: "#F5D76E",
    headerText: "#333333",
    modalBg: "#FFFFFF",
    emptyText: "#888",
    chartLine: "#3B82F6", // 折线主色
    chartFill: "#BFDBFE", // 折线下方填充
  },
  fonts: configureFonts({ config: fontConfig, isV3: true })
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#C7A93A", // FAB/主按钮金色
    background: "#1B1A17", // 页面背景
    surface: "#2A2824", // 卡片、模态背景
    text: "#EAEAEA", // 主文字
    secondary: "#D1A9FF", // 紫色文字
    outline: "#3E3C38", // 分割线
    income: "#E57373", // 收入
    expense: "#81C784", // 支出
    chipBg: "#3B3A35",
    chipSelectedBg: "#3C2A4C",
    headerBg: "#3B362F",
    headerText: "#F5EBC7",
    modalBg: "#2B2A27",
    emptyText: "#AAA",
    chartLine: "#93C5FD",
    chartFill: "#1E40AF",
  },
  fonts: configureFonts({ config: fontConfig, isV3: true }),
};

export type AppTheme = typeof lightTheme;
export const AppThemeContext = React.createContext<AppTheme>(lightTheme);

export const useAppTheme = () => useContext(AppThemeContext);