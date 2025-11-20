import { useAppTheme } from "@/src/constants/theme";
import dayjs from "dayjs";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { Alert, StyleSheet, View } from "react-native";
import { Avatar, Button, Card, Divider, Switch, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../src/store/authStore";
import { useTxStore } from "../src/store/transactionStore";
import { useUIStore } from "../src/store/uiStore";

export default function SettingsPage() {
  const theme = useAppTheme();
  const { colors } = useTheme();
  const darkMode = useUIStore((state) => state.darkMode);
  const toggleDarkMode = useUIStore((state) => state.toggleDark);
  const store = useTxStore();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  // 格式化注册时间
  const formatRegisterDuration = (createdAt: string) => {
    if (!createdAt) return "";

    const start = dayjs(createdAt);
    const now = dayjs();

    const diffYears = now.diff(start, "year");
    const diffMonths = now.diff(start, "month") % 12;
    const diffDays = now.diff(start, "day") % 30;

    if (diffYears >= 1) {
      return `${diffYears}年${diffMonths}月${diffDays}日`;
    } else if (diffMonths >= 1) {
      return `${diffMonths}个月${diffDays}日`;
    } else {
      return `${now.diff(start, "day")}日`;
    }
  };

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
    router.replace("/login");
  };

  const testBtn = async () => {
    console.log("TEST===");
    // const token = AsyncStorage.getItem("token");
    console.log("user: ", user);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}>

{user && (
  <Card
    style={{
      marginBottom: 20,
      paddingVertical: 20,
      paddingHorizontal: 16,
      borderRadius: 16,
      elevation: 3,                   // 安卓阴影
      shadowColor: "#000",           // iOS 阴影
      shadowOpacity: 0.12,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
    }}
  >
    {/* 顶部：头像 + 用户名 */}
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
      <Avatar.Text
        label={user.username?.[0]?.toUpperCase() ?? "U"}
        size={48}
        style={{ marginRight: 12 }}
      />

      <View>
        <Text variant="titleLarge" style={{ fontWeight: "600" }}>
          {user.username}
        </Text>
        <Text variant="bodySmall" style={{ color: "gray" }}>
          用户信息
        </Text>
      </View>
    </View>

    <Divider style={{ marginVertical: 10 }} />

    {/* 详情信息 */}
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text variant="bodyMedium" style={{ color: "#666" }}>邮箱</Text>
        <Text variant="bodyMedium">{user.email}</Text>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text variant="bodyMedium" style={{ color: "#666" }}>已注册时间</Text>
        <Text variant="bodyMedium">{formatRegisterDuration(user.created_at)}</Text>
      </View>
    </View>
  </Card>
)}

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
        style={{ marginTop: 10 }}>
        退出登录
      </Button>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
});
