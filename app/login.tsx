import { useAppTheme } from "@/src/constants/theme";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, HelperText, Text, TextInput } from "react-native-paper";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useAuthStore } from "../src/store/authStore";
import ErrorToast from "./components/ErrorToast";

export default function Login() {
  const theme = useAppTheme();
  // const login = useAuthStore((state) => state.login);
  // const loading = useAuthStore((state) => state.loading);
  const { login, register, loading } = useAuthStore();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [username, setUsername] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [globalError, setGlobalError] = useState("");

  // 动画
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const marginBottom = useSharedValue(30);
  const opacity = useSharedValue(0);

  const validate = () => {
    let valid = true;

    if (isRegister && !username.trim()) {
      setUsernameError("用户名不能为空");
      valid = false;
    } else {
      setUsernameError("");
    }

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
      setGlobalError("");
      if (!validate()) return;

      if (isRegister) {
        const res = await register(username, email, password);
        if (!res.ok) {
          setGlobalError(res.message ?? "");
          return;
        } else {
          setIsRegister(false);
          router.replace("/home");
        }
      } else {
        const res = await login(email, password);
        if (!res.ok) {
          setGlobalError(res.message ?? "");
          return;
        } else {
          router.replace("/home");
        }
      }
    } catch (err) {
      console.log(err);
      setGlobalError("请求失败，请检查网络连接");
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
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {globalError !== "" && (
        <ErrorToast
          message={globalError}
          onHide={() => setGlobalError("")}
        />
      )}
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

          {isRegister && (
            <>
              <HelperText
                type="error"
                visible={!!usernameError}>
                {usernameError}
              </HelperText>
              <TextInput
                label="用户名"
                value={username}
                onChangeText={setUsername}
                mode="outlined"
                style={styles.input}
                error={!!usernameError}
              />
            </>
          )}

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
            {isRegister ? "注册" : "登录"}
          </Button>

          <View style={{ marginTop: 16, alignItems: "center" }}>
            <Button
              mode="text"
              onPress={() => setIsRegister(!isRegister)}
              textColor={theme.colors.primary}>
              {isRegister ? "已有账号？去登录" : "没有账号？去注册"}
            </Button>
          </View>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
