import { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export default function ErrorToast({ message, onHide }: { message: string; onHide: () => void }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-20);

  useEffect(() => {
    // 淡入
    opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
    translateY.value = withTiming(0, { duration: 300 });

    // 3 秒后自动消失
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(-20, { duration: 300 });
      setTimeout(onHide, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 40,
    alignSelf: "center",
    backgroundColor: "#ff4d4f",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    zIndex: 999,
  },
  text: {
    color: "white",
    fontSize: 14,
  },
});
