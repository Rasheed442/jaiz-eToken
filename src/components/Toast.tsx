import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ToastProps = {
  visible: boolean;
  message: string;
  type?: "error" | "success" | "info";
  duration?: number;
  onHide?: () => void;
};

export default function Toast({
  visible,
  message,
  type = "error",
  duration = 3000,
  onHide
}: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();

      const timer = setTimeout(() => {
        hide();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hide();
    }
  }, [visible]);

  const hide = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      })
    ]).start(() => {
      if (onHide) onHide();
    });
  };

  const getBackgroundColor = () => {
    switch (type) {
      case "error":
        return "#B3261E";
      case "success":
        return "#1E8E5A";
      case "info":
        return "#123E7C";
      default:
        return "#B3261E";
    }
  };

  return (
    <Animated.View
      style={{
        transform: [{ translateY }],
        opacity
      }}
      className="absolute left-0 right-0 z-50"
    >
      <SafeAreaView edges={["top"]}>
        <View
          className="mx-4 mt-2 rounded-xl px-4 py-3"
          style={{ backgroundColor: getBackgroundColor() }}
        >
          <Text className="text-[14px] font-outfit-medium text-white">
            {message}
          </Text>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}
