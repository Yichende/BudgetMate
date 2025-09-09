import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Button, Switch, Text, useTheme } from "react-native-paper";
import { useAuthStore } from "../src/store/authStore";
import { useTxStore } from "../src/store/transactionStore";
import { useUIStore } from "../src/store/uiStore";

export default function SettingsPage() {
  const { colors } = useTheme();
  const darkMode = useUIStore((state) => state.darkMode);
  const toggleDarkMode = useUIStore((state) => state.toggleDark);
  const store = useTxStore();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const exportData = async () => {
    try {
      const data = JSON.stringify(store.items, null, 2);
      const fileUri = FileSystem.documentDirectory + "transactions.json";
      await FileSystem.writeAsStringAsync(fileUri, data);
      await Sharing.shareAsync(fileUri);
    } catch (err) {
      Alert.alert("导出失败", String(err));
    }
  };

  const importData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
      });
      if (result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        const content = await FileSystem.readAsStringAsync(fileUri);
        const json = JSON.parse(content);
        if (Array.isArray(json)) {
          for (const item of json) {
            await store.add({
              type: item.type,
              category: item.category,
              amount: item.amount,
              note: item.note,
              date: item.date,
            });
          }
          Alert.alert("导入成功");
        }
      }
    } catch (err) {
      Alert.alert("导入失败", String(err));
    }
  };

  const logoutSubmit = async () => {
    await logout();
    Alert.alert('退出登录');
    router.replace("/login");
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text>深色模式</Text>
        <Switch
          value={darkMode}
          onValueChange={toggleDarkMode}
        />
      </View>

      <Button
        mode="contained"
        onPress={exportData}
        style={{ backgroundColor: colors.primary, marginBottom: 10 }}>
        导出数据
      </Button>

      <Button
        mode="outlined"
        onPress={importData}>
        导入数据
      </Button>
      <Button
      mode="contained"
      onPress={logoutSubmit}
      style={{ marginTop: 10}}>
        退出登录
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#FFFBEA" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
});