import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Modal, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type LoadingOverlayProps = {
  visible: boolean;
  message?: string;
};

const DOT_COUNT = 3;
const DOT_STAGGER_MS = 160;

export default function LoadingOverlay({ visible, message = "Logging in..." }: LoadingOverlayProps) {
  const enter = useRef(new Animated.Value(0)).current;
  const dots = useMemo(
    () => Array.from({ length: DOT_COUNT }, () => new Animated.Value(0)),
    []
  );

  // One entrance animation for the whole screen
  useEffect(() => {
    if (!visible) {
      enter.setValue(0);
      return;
    }
    Animated.timing(enter, {
      toValue: 1,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start();
  }, [visible, enter]);

  // Staggered looping dots, stopped when the overlay closes
  useEffect(() => {
    if (!visible) return;

    const loops = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * DOT_STAGGER_MS),
          Animated.timing(dot, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 350, useNativeDriver: true }),
          Animated.delay((DOT_COUNT - 1 - i) * DOT_STAGGER_MS)
        ])
      )
    );
    loops.forEach((l) => l.start());

    return () => {
      loops.forEach((l) => l.stop());
      dots.forEach((d) => d.setValue(0));
    };
  }, [visible, dots]);

  const logoScale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  const textShift = enter.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <SafeAreaView className="flex-1 bg-[#F8C300]">
        {/* Center: logo, wordmark, status */}
        <View className="flex-1 items-center justify-center px-8">
          <Animated.View
            style={{
              opacity: enter,
              transform: [{ scale: logoScale }],
              shadowColor: "#193F7F",
              shadowOpacity: 0.18,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
              elevation: 8
            }}
            className="h-24 w-24 items-center justify-center rounded-3xl bg-white"
          >
            <Text className="text-[40px] font-outfit-bold text-[#193F7F]">J</Text>
          </Animated.View>

          <Animated.View
            style={{ opacity: enter, transform: [{ translateY: textShift }] }}
            className="mt-6 items-center"
          >
            <Text className="text-center text-[30px] tracking-wide text-[#193F7F]">
              <Text className="font-outfit-bold">JAIZ</Text>
              <Text className="font-outfit-medium"> eToken</Text>
            </Text>
          </Animated.View>

          <Animated.View style={{ opacity: enter }} className="mt-10 items-center">
            <View className="flex-row items-center gap-2" accessibilityRole="progressbar">
              {dots.map((dot, i) => (
                <Animated.View
                  key={i}
                  style={{
                    opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
                    transform: [
                      { scale: dot.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.15] }) }
                    ]
                  }}
                  className="h-2.5 w-2.5 rounded-full bg-[#193F7F]"
                />
              ))}
            </View>
            <Text className="mt-4 text-[16px] font-outfit-medium text-[#193F7F]">{message}</Text>
          </Animated.View>
        </View>

        {/* Footer: secondary reassurance, pinned to the bottom */}
        <Animated.View style={{ opacity: enter }} className="items-center px-8 pb-6">
          <Text className="text-[13px] font-outfit text-[#193F7F]/70">
            Securing your session
          </Text>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}