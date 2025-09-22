import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import Animated, { FadeIn } from "react-native-reanimated";
import { useAuthStore } from "../src/store/authStore";

export default function LoginScreen() {
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async () => {
    try {
      if (!email || !password) return;
      const ok = await login(email, password);
      if (ok) router.replace("/home");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={styles.container}>
      <Text
        variant="headlineMedium"
        style={{ textAlign: "center", marginBottom: 20 }}>
        欢迎使用 BudgetMate
      </Text>

      <TextInput
        label="邮箱"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="密码"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        mode="outlined"
        style={styles.input}
      />
      <Button
        mode="contained"
        onPress={submit}
        loading={loading}>
        登录
      </Button>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFBEA",
    justifyContent: "center",
    padding: 20,
  },
  input: { marginBottom: 12 },
});
