import { useAppTheme } from "@/src/constants/theme";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Href, usePathname, useRouter } from "expo-router";
import { Appbar } from "react-native-paper";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useAppTheme();
  const styles = useThemedStyles((theme) => ({
    container: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "space-around",
      backgroundColor: theme.colors.background,
    },
  }));

  const tabs: {icon: string; path: Href}[] = [
    { icon: "chart-bar", path: "/home" },
    { icon: "file-document", path: "/billsDetails" },
    { icon: "cog", path: "/settings" },
  ];

  const isHome = pathname === "/home" || pathname === "/";

  return (
    <Appbar style={styles.container}>
      {tabs.map((t) => {
        const isActive =
          t.path === "/home" ? isHome : pathname === t.path;

        return (
          <Appbar.Action
            key={String(t.path)}
            icon={t.icon}
            onPress={() => router.push(t.path)}
            color={
              isActive ? theme.colors.primary : theme.colors.onSurfaceVariant
            }
            size={isActive ? 32 : 26}
          />
        );
      })}
    </Appbar>
  );
}
