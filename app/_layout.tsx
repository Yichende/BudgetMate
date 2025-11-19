import { useAuthStore } from "@/src/store/authStore";
import * as Font from "expo-font";
import { Stack, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider as PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppThemeContext, darkTheme, lightTheme } from "../src/constants/theme";
import { useUIStore } from "../src/store/uiStore";
import BottomNav from "./components/BottomNav";

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const darkMode = useUIStore((state) => state.darkMode);
  const theme = darkMode ? darkTheme : lightTheme;

  const segments = useSegments(); // 获取当前路径
  const isLogin = segments[0] === "login"; // 判断是不是 login 页面

  const restore = useAuthStore((state) => state.restore)

  useEffect(() => {
    async function init() {
      await Font.loadAsync({
        Inter: require("../assets/fonts/Inter-Regular.ttf"),
        "Inter-Bold": require("../assets/fonts/Inter-Bold.ttf"),
        NotoSansSC: require("../assets/fonts/NotoSansSC-Regular.ttf"),
        "NotoSansSC-Bold": require("../assets/fonts/NotoSansSC-Bold.ttf"),
      });
      setFontsLoaded(true);
      await restore();
    }
    init();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppThemeContext.Provider value={theme}>
            <PaperProvider theme={theme}>
              <Stack screenOptions={{ headerShown: false }} />
              {!isLogin && <BottomNav />}
            </PaperProvider>
        </AppThemeContext.Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
