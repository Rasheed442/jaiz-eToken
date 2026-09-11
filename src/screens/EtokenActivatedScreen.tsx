import { Check, Smartphone } from "lucide-react-native";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

type EtokenActivatedScreenProps = {
  onGoToLogin: () => void;
  deviceLabel?: string;
};

export default function EtokenActivatedScreen({
  onGoToLogin,
  deviceLabel = "This device"
}: EtokenActivatedScreenProps) {
  const badgeScale = useSharedValue(0);

  useEffect(() => {
    badgeScale.value = withDelay(
      150,
      withSequence(
        withSpring(1.1, { damping: 8, stiffness: 120 }),
        withSpring(1, { damping: 10, stiffness: 150 })
      )
    );
  }, []);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }]
  }));

  return (
    <SafeAreaView className="flex-1 bg-[#F3F5F7]">
      <View className="flex-1 px-6">
        <View className="flex-1 items-center justify-center">
          <Animated.View
            style={badgeStyle}
            className="h-20 w-20 items-center justify-center rounded-3xl border-2 border-[#F5B400] bg-[#123E7C]"
          >
            <Check size={36} color="white" strokeWidth={3} />
          </Animated.View>

          <Animated.View entering={FadeIn.duration(400).delay(300)}>
            <Text className="mt-7 text-center text-[28px] font-outfit-semibold text-[#1B2D4A]">
              eToken Activated
            </Text>
            <Text className="mt-3 max-w-[280px] text-center text-[15px] font-outfit text-[#67787F]">
              Your device is now registered. You can generate secure codes anytime.
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeIn.duration(400).delay(450)}
            className="mt-8 w-full flex-row items-center gap-3 rounded-2xl bg-[#D6E4F5] px-4 py-4"
          >
            <Smartphone size={22} color="#123E7C" />
            <View>
              <Text className="text-[12px] font-outfit text-[#5B7699]">
                Device
              </Text>
              <Text className="text-[15px] font-outfit-semibold text-[#1B2D4A]">
                {deviceLabel} · Registered just now
              </Text>
            </View>
          </Animated.View>
        </View>

        <Animated.View entering={FadeIn.duration(400).delay(600)} className="pb-10">
          <Pressable
            accessibilityRole="button"
            onPress={onGoToLogin}
            className="flex-row items-center justify-center rounded-[28px] bg-[#123E7C] px-5 py-4 active:opacity-80"
          >
            <Text className="text-[18px] font-outfit-semibold text-white">
              Go to Login
            </Text>
            <Text className="ml-2 text-[22px] font-light text-white">›</Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}