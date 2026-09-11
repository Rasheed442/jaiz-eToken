import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

type AccountType = "Personal" | "Corporate";

const accountOptions: AccountType[] = ["Personal", "Corporate"];

export default function WelcomeScreen({
  onContinue,
  onLogin
}: {
  onContinue: (accountType: AccountType) => void;
  onLogin: () => void;
}) {
  const [accountType, setAccountType] = useState<AccountType>("Personal");
  const [segmentWidth, setSegmentWidth] = useState(0);
  const sliderX = useSharedValue(0);

  const selectedIndex = accountOptions.indexOf(accountType);

  useEffect(() => {
    if (segmentWidth > 0) {
      sliderX.value = withTiming(selectedIndex * segmentWidth, {
        duration: 220
      });
    }
  }, [segmentWidth, selectedIndex, sliderX]);

  const sliderStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sliderX.value }]
  }));

  return (
    <View className="flex-1 bg-[#193F7F]">
      <LinearGradient
        colors={["#132C58", "#1D3F7C", "#6E6C4A"]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 620 }}
      />

      <SafeAreaView className="flex-1 pt-6">
        <View className="w-full px-8 pt-16">
          <View className="flex-row items-center">
            <View className="h-11 w-11 items-center justify-center rounded-xl border-2 border-[#F8C300] bg-white">
              <Text className="text-lg font-bold text-[#193F7F]">J</Text>
            </View>
            <View className="ml-3">
              <Text className="text-base font-bold tracking-wide text-white">
                JAIZ
              </Text>
              <Text className="text-xs font-semibold tracking-wide text-[#F8C300]">
                eTOKEN
              </Text>
            </View>
          </View>

          <View className="pt-28">
            <Text className="text-[40px] font-bold leading-[42px] text-white">
              Your code,
            </Text>
            <Text className="text-[40px] font-bold leading-[42px] text-white">
              your control.
            </Text>
            <Text className="mt-4 text-[15px] font-normal leading-6 text-white/70">
              Six-digit security for every Jaiz transaction — generated right on
              your device.
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <View className="mt-48 w-full flex-1 rounded-t-[30px] bg-[#F3F5F7] px-5 py-0">
        <View className="mb-5 mt-8 h-1.5 w-16 self-start rounded-full bg-[#D5D9E0]" />

        <Text className="mb-4 text-[15px] pt-2 font-medium text-[#67787F]">
          Continue as
        </Text>

        <View
          className="relative flex-row rounded-full bg-[#E6E7EA] p-1"
          onLayout={(event) => {
            const width = event.nativeEvent.layout.width;
            const nextSegmentWidth = width / accountOptions.length;
            setSegmentWidth(nextSegmentWidth);
          }}
        >
          <Animated.View
            style={[
              {
                position: "absolute",
                top: 4,
                bottom: 4,
                left: 4,
                width: Math.max(segmentWidth - 8, 0),
                borderRadius: 999,
                backgroundColor: "#123E7C"
              },
              sliderStyle
            ]}
          />

          {accountOptions.map((option) => {
            const isSelected = option === accountType;

            return (
              <Pressable
                key={option}
                onPress={() => setAccountType(option)}
                className={[
                  "flex-1 rounded-full px-4 py-5",
                  isSelected ? "z-10" : "z-0"
                ].join(" ")}
              >
                <Text
                  className={[
                    "text-center text-[16px] font-semibold",
                    isSelected ? "text-white" : "text-[#8A93A6]"
                  ].join(" ")}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={() => onContinue(accountType)}
          className="mt-6 flex-row items-center justify-center rounded-[28px] bg-[#123E7C] px-4 py-5"
        >
          <Text className="text-[17px] font-semibold text-white">Continue</Text>
          <Text className="ml-2 text-[22px] font-light text-white">›</Text>
        </Pressable>

        <View className="mt-6 flex-row items-center justify-center pb-8">
          <Text className="text-[14px] text-[#67787F] font-normal">
            Already registered?{" "}
          </Text>
          <Pressable onPress={onLogin} hitSlop={8}>
            <Text className="text-[14px] font-semibold text-[#123E7C]">
              Log in
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
