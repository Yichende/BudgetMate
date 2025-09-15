import React, { useRef } from "react";
import { Animated, Pressable } from "react-native";
import { Chip } from "react-native-paper";

interface AnimatedChipProps {
  selected?: boolean;
  icon?: string;
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
  selectedColor?: string;
}

const AnimatedChip: React.FC<AnimatedChipProps> = ({
  selected,
  icon,
  children,
  onPress,
  style,
  selectedColor,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    // 执行动画
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    // 调用传入的 onPress
    onPress?.();
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Chip
          icon={icon}
          selected={selected}
          selectedColor={selectedColor}
          style={style}
        >
          {children}
        </Chip>
      </Animated.View>
    </Pressable>
  );
};

export default AnimatedChip;
