import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { Button, HelperText, Text, TextInput } from "react-native-paper";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useAuthStore } from "../src/store/authStore";

export default function LoginScreen() {
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // 动画
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const marginBottom = useSharedValue(30);
  const opacity = useSharedValue(0);

  const validate = () => {
    let valid = true;

    if (!email) {
      setEmailError("邮箱不能为空");
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("请输入有效的邮箱地址");
      valid = false;
    } else {
      setEmailError("");
    }

    if (!password) {
      setPasswordError("密码不能为空");
      valid = false;
    } else if (password.length < 6) {
      setPasswordError("密码长度至少 6 位");
      valid = false;
    } else {
      setPasswordError("");
    }

    return valid;
  };

  const submit = async () => {
    try {
      if (!validate()) return;
      const ok = await login(email, password);
      if (ok) router.replace("/home");
    } catch (err) {
      console.log(err);
    }
  };

  // 动画播放完后缩放
  const onAnimationFinish = () => {
    scale.value = withTiming(0.5, {
      duration: 500, // 500 毫秒过渡
      easing: Easing.ease, // 使用缓动函数来平滑过渡
    });

    translateY.value = withTiming(-120, {
      duration: 500,
      easing: Easing.out(Easing.exp),
    });

    marginBottom.value = withTiming(-120, {
      duration: 500,
      easing: Easing.ease,
    });

    opacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.ease,
    });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      marginBottom: marginBottom.value,
    };
  });

  const afterAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const opacityStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={styles.container}>
      <Animated.View style={afterAnimatedStyle}>
        <Animated.View style={animatedStyle}>
          <LottieView
            source={require("../assets/animations/welcome.json")}
            autoPlay
            loop={false}
            onAnimationFinish={onAnimationFinish} // 动画播放完后触发缩放
            style={styles.lottie} // 自定义动画样式
          />
        </Animated.View>

        <Animated.View style={[opacityStyle]}>
          <MaskedView
            maskElement={
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "bold",
                  textAlign: "center",
                }}>
                BudgetMate
              </Text>
            }>
            <LinearGradient
              colors={["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}>
              <Text style={{ opacity: 0, fontSize: 28, fontWeight: "bold" }}>
                BudgetMate
              </Text>
            </LinearGradient>
          </MaskedView>

          <HelperText
            type="error"
            visible={!!emailError}>
            {emailError}
          </HelperText>
          <TextInput
            label="邮箱"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            style={styles.input}
            error={!!emailError}
          />

          <HelperText
            type="error"
            visible={!!passwordError}>
            {passwordError}
          </HelperText>
          <TextInput
            label="密码"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            mode="outlined"
            style={styles.input}
            error={!!passwordError}
          />

          <Button
            mode="contained"
            onPress={submit}
            loading={loading}
            style={styles.submitBtn}>
            登录
          </Button>
        </Animated.View>
      </Animated.View>
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
  input: { marginBottom: 4 },
  submitBtn: { marginTop: 12 },
  lottie: {
    width: 400,
    height: 400,
    alignSelf: "center",
  },
});
