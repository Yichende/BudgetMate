import { useAppTheme } from "@/src/constants/theme";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { usePathname, useRouter } from "expo-router";
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

  return (
    <Appbar style={styles.container}>
      <Appbar.Action
        icon="chart-bar"
        onPress={() => router.push("/home")}
        color={
          pathname === "/home"
            ? theme.colors.primary
            : theme.colors.onSurfaceVariant
        }
        size={pathname === "/home" ? 32 : 26}
      />
      <Appbar.Action
        icon="file-document"
        onPress={() => {
          console.log("go bills-details");
          router.push("/bills-details");
        }}
        color={
          pathname === "/bills-details"
            ? theme.colors.primary
            : theme.colors.onSurfaceVariant
        }
        size={pathname === "/bills-details" ? 32 : 26}
      />
      <Appbar.Action
        icon="cog"
        onPress={() => router.push("/settings")}
        color={
          pathname === "/settings"
            ? theme.colors.primary
            : theme.colors.onSurfaceVariant
        }
        size={pathname === "/settings" ? 32 : 26}
      />
    </Appbar>
  );
}
