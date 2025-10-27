import { useAppTheme } from "@/src/constants/theme";
import { useMemo } from "react";
import { StyleSheet } from "react-native";

export function useThemedStyles(stylesFn: (theme: any) => any) {
  const theme = useAppTheme();
  return useMemo(() => StyleSheet.create(stylesFn(theme)), [theme]);
}