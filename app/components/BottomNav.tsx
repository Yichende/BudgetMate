import { useAppTheme } from "@/src/constants/theme";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { usePathname, useRouter } from "expo-router";
import { Appbar } from "react-native-paper";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useAppTheme();
  const styles = useThemedStyles((theme) => ({
    bottom: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "space-around",
      backgroundColor: theme.colors.background
    },
  }));

  return (
    <Appbar style={styles.bottom}>
      <Appbar.Action
        icon="chart-bar"
        onPress={() => router.push("/home")}
        color={pathname === "/home" ? "#8A0993" : undefined}
      />
      <Appbar.Action
        icon="file-document"
        onPress={() => {
          console.log("go bills-details");
          router.push("/bills-details");
        }}
        color={pathname === "/bills-details" ? "#8A0993" : undefined}
      />
      <Appbar.Action
        icon="cog"
        onPress={() => router.push("/settings")}
        color={pathname === "/settings" ? "#8A0993" : undefined}
      />
    </Appbar>
  );
}
