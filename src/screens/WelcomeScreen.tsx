import {
  ArrowRight,
  BriefcaseBusiness,
  ShieldCheck,
  UserRound
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  Text,
  View,
  useWindowDimensions
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AccountType = "Personal" | "Corporate";

const accountOptions: AccountType[] = ["Personal", "Corporate"];

function BackgroundPattern() {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 170,
        overflow: "hidden",
        opacity: 0.52
      }}
    >
      {Array.from({ length: 8 }).map((_, row) => (
        <View
          key={row}
          style={{
            flexDirection: "row",
            marginLeft: row % 2 === 0 ? -10 : -34,
            marginTop: -2
          }}
        >
          {Array.from({ length: 12 }).map((__, column) => (
            <View
              key={`${row}-${column}`}
              style={{
                width: 48,
                height: 24,
                marginRight: -5,
                borderRadius: 12,
                backgroundColor:
                  (row + column) % 3 === 0 ? "#1F63A1" : "#0C5795"
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

export default function WelcomeScreen({
  onContinue,
  onLogin
}: {
  onContinue: (accountType: AccountType) => void;
  onLogin: () => void;
}) {
  const [accountType, setAccountType] = useState<AccountType>("Personal");
  const [segmentWidth, setSegmentWidth] = useState(0);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const sliderX = useSharedValue(0);
  const panelHeight = Math.min(420, Math.max(370, height * 0.455));

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

  const accountDescription =
    accountType === "Personal"
      ? "Set up in minutes with your account number, BVN and a quick selfie — no branch visit needed."
      : "Set up your business eToken with your account details and an authorised representative.";

  return (
    <View className="flex-1 overflow-hidden bg-[#064783]">
      {/* Oversized brand ring */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -122,
          right: -132,
          width: 350,
          height: 350,
          borderRadius: 175,
          backgroundColor: "#FFB900"
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -72,
          right: -82,
          width: 250,
          height: 250,
          borderRadius: 125,
          backgroundColor: "#064783"
        }}
      />

      {/* Subtle repeating pattern behind the welcome copy */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: panelHeight,
          height: 170
        }}
      >
        <BackgroundPattern />
      </View>

      <View
        style={{
          position: "absolute",
          top: insets.top + 20,
          left: 24,
          right: 24,
          bottom: panelHeight + 84,
          justifyContent: "space-between"
        }}
      >
        <View className="flex-row items-center">
          <Image
            source={require("../../assets/images/jaizlogo.png")}
            accessibilityLabel="Jaiz Bank logo"
            resizeMode="contain"
            style={{ width: 28, height: 28 }}
          />
          <Text className="ml-1.5 text-[18px] font-outfit-semibold text-white">
            jaiz bank
          </Text>
          <View className="mx-3 h-6 w-px bg-white/45" />
          <Text className="text-[15px] font-outfit-semibold text-[#FFB900]">
            eToken
          </Text>
        </View>

        <View>
          <Text className="text-[36px] font-outfit-bold leading-[39px] text-white">
            Your trust,
          </Text>
          <Text className="text-[36px] font-outfit-bold leading-[39px] text-[#FFB900]">
            safely kept.
          </Text>
          <Text className="mt-4 max-w-[350px] text-[15px] font-outfit leading-[24px] text-[#D5E4F5]">
            Approve every Jaiz transaction with a secure code generated on your
            own phone.
          </Text>
        </View>
      </View>

      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: panelHeight,
          paddingBottom: Math.max(insets.bottom, 16)
        }}
        className="rounded-t-[28px] bg-white px-6 pt-3"
      >
        <View className="flex-1">
          <View className="h-1 w-10 self-center rounded-full bg-[#D9DDE3]" />

          <Text className="mt-5 text-[14px] font-outfit-semibold text-[#4F5661]">
            Continue as
          </Text>

          <View
            className="relative mt-3 flex-row rounded-2xl bg-[#F0F1F3] p-1"
            onLayout={(event) => {
              setSegmentWidth(
                event.nativeEvent.layout.width / accountOptions.length
              );
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
                  borderRadius: 13,
                  backgroundColor: "#064783",
                  shadowColor: "#0A3155",
                  shadowOpacity: 0.18,
                  shadowRadius: 5,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: 3
                },
                sliderStyle
              ]}
            />

            {accountOptions.map((option) => {
              const isSelected = option === accountType;
              const Icon = option === "Personal" ? UserRound : BriefcaseBusiness;

              return (
                <Pressable
                  key={option}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setAccountType(option)}
                  className="z-10 h-12 flex-1 flex-row items-center justify-center rounded-xl active:opacity-80"
                >
                  <Icon
                    size={17}
                    color={isSelected ? "#FFB900" : "#555D67"}
                    strokeWidth={2}
                  />
                  <Text
                    className={`ml-2 text-[15px] font-outfit-semibold ${
                      isSelected ? "text-white" : "text-[#555D67]"
                    }`}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View className="mt-3 min-h-[82px] flex-row items-start rounded-2xl bg-[#FFF7DF] px-4 py-3">
            <ShieldCheck size={19} color="#075091" strokeWidth={2.2} />
            <Text className="ml-3 flex-1 text-[13px] font-outfit leading-[20px] text-[#3F5369]">
              {accountDescription}
            </Text>
          </View>

          <View className="flex-1" />

          <Pressable
            accessibilityRole="button"
            onPress={() => onContinue(accountType)}
            className="h-14 flex-row items-center justify-center rounded-2xl bg-[#064783] active:opacity-80"
          >
            <Text className="text-[16px] font-outfit-semibold text-white">
              Continue
            </Text>
            <View className="ml-2">
              <ArrowRight size={19} color="#FFB900" strokeWidth={2.5} />
            </View>
          </Pressable>

          <View className="mt-3 flex-row items-center justify-center">
            <Text className="text-[13px] font-outfit text-[#69717B]">
              Already registered?{" "}
            </Text>
            <Pressable onPress={onLogin} hitSlop={8} accessibilityRole="button">
              <Text className="text-[13px] font-outfit-semibold text-[#064783]">
                Log in
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
