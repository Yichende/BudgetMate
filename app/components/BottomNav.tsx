import { usePathname, useRouter } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";
import { Appbar } from "react-native-paper";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Appbar style={styles.bottom}>
      <Appbar.Action
        icon="chart-bar"
        onPress={() => router.push("/home")}
      />
      <Appbar.Action
        icon="file-document"
        onPress={() => {
          console.log("go bills-details");
          router.push("/bills-details");
        }}
      />
      <Appbar.Action
        icon="cog"
        onPress={() => router.push("/settings")}
        color={pathname === "/settings" ? "#8A0993" : undefined}
      />
    </Appbar>
  );
}

const styles = StyleSheet.create({
  bottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-around",
    backgroundColor: "#F5D76E"
  },
});
