import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { Bell, Copy, RefreshCw, Smartphone } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

type HomeScreenProps = {
  fullName: string;
  cifLast4: string;
  deviceName?: string;
  deviceLocation?: string;
  onManageDevice: () => void;
  onNotificationsPress: () => void;
  codeDurationSeconds?: number;
};

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000)
    .toString()
    .replace(/(\d{3})(\d{3})/, "$1 $2");
}

export default function HomeScreen({
  fullName,
  cifLast4,
  deviceName = "iPhone 14 Pro",
  deviceLocation = "Lagos",
  onManageDevice,
  onNotificationsPress,
  codeDurationSeconds = 30
}: HomeScreenProps) {
  const [code, setCode] = useState(generateCode());
  const [secondsLeft, setSecondsLeft] = useState(codeDurationSeconds);
  const [copied, setCopied] = useState(false);
  const progress = useSharedValue(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const initials = fullName
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const startTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSecondsLeft(codeDurationSeconds);
    progress.value = 1;
    progress.value = withTiming(0, {
      duration: codeDurationSeconds * 1000,
      easing: Easing.linear
    });

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setCode(generateCode());
          progress.value = 1;
          progress.value = withTiming(0, {
            duration: codeDurationSeconds * 1000,
            easing: Easing.linear
          });
          return codeDurationSeconds;
        }
        return prev - 1;
      });
    }, 1000);
  }, [codeDurationSeconds, progress]);

  useEffect(() => {
    startTimer();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startTimer]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`
  }));

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code.replace(/\s/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleGenerateNew = () => {
    setCode(generateCode());
    startTimer();
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeLabel = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <SafeAreaView className="flex-1 bg-[#F8F8F8]">
      <View className="flex-1 px-6 pt-2">
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-[#1D4689]">
              <Text className="text-[14px] font-outfit-semibold text-white">
                {initials}
              </Text>
            </View>
            <View className="ml-3">
              <Text className="text-[15px] font-outfit-semibold text-[#1B2D4A]">
                {fullName}
              </Text>
              <Text className="text-[13px] font-outfit text-[#67787F]">
                Personal · CIF •••• {cifLast4}
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={onNotificationsPress}
            className="h-11 w-11 items-center justify-center rounded-full bg-white active:opacity-70"
          >
            <Bell size={20} color="#1B2D4A" />
          </Pressable>
        </View>

        {/* OTP Card */}
        <View className="relative mt-6 h-[236px] overflow-hidden rounded-2xl bg-[#214788] px-5 pb-8 pt-5">
          <LinearGradient
            colors={["#132C58", "#1D3F7C", "#928e54"]}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 470
            }}
          />
          {/* <LinearGradient
                  colors={["#132C58", "#1D3F7C", "#6E6C4A"]}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 1, y: 0 }}
                  style={{ position: "absolute", top: 0, left: 0, right: 0, height: 620 }}
                /> */}
          {/* <LinearGradient
            pointerEvents="none"
            colors={["transparent", "rgba(116, 117, 79, 0.88)", "transparent"]}
            locations={[0, 0.62, 1]}
            start={{ x: 0.28, y: 0 }}
            end={{ x: 1, y: 0.82 }}
            className="absolute inset-0"
          /> */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5 rounded-full bg-white/15 px-3 py-2">
              <View className="h-1.5 w-1.5 rounded-full bg-[#4ADE80]" />
              <Text className="text-[14px] font-outfit-medium text-white">
                Active
              </Text>
            </View>
            <Text className="text-[13px] font-outfit-medium tracking-wide text-white/60">
              JAIZ eTOKEN
            </Text>
          </View>

          <Text className="mt-5  pb-2 text-[42px] font-outfit-bold tracking-wider text-white">
            {code}
          </Text>

          <Text className="mt-3 text-[14px] font-outfit text-white">
            Your one-time verification code
          </Text>

          <View className="mt-8 h-1.5 w-full overflow-hidden rounded-full bg-white/25">
            <Animated.View
              style={progressStyle}
              className="h-full rounded-full bg-[#F5B400]"
            />
          </View>

          <Text className="mt-3 text-[13px] font-outfit text-white">
            Expires in {timeLabel}
          </Text>
        </View>

        {/* Actions */}
        <View className="mt-4 flex-row gap-3">
          <Pressable
            accessibilityRole="button"
            onPress={handleCopy}
            className="flex-1 items-center rounded-2xl bg-white px-4 py-4 active:opacity-70"
          >
            <View className="h-9 w-9 items-center justify-center rounded-full bg-[#EAF0FB]">
              <Copy size={18} color="#123E7C" />
            </View>
            <Text className="mt-2 text-[14px] font-outfit-medium text-[#1B2D4A]">
              {copied ? "Copied!" : "Copy code"}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={handleGenerateNew}
            className="flex-1 items-center rounded-2xl bg-white px-4 py-4 active:opacity-70"
          >
            <View className="h-9 w-9 items-center justify-center rounded-full bg-[#EAF0FB]">
              <RefreshCw size={18} color="#123E7C" />
            </View>
            <Text className="mt-2 text-[14px] font-outfit-medium text-[#1B2D4A]">
              Generate new
            </Text>
          </Pressable>
        </View>

        {/* Device card */}
        <Pressable
          onPress={onManageDevice}
          className="mt-4 flex-row items-center justify-between rounded-2xl bg-white px-4 py-4 active:opacity-70"
        >
          <View className="flex-row items-center">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-[#F0F1F2]">
              <Smartphone size={18} color="#1B2D4A" />
            </View>
            <View className="ml-3">
              <Text className="text-[15px] font-outfit-semibold text-[#1B2D4A]">
                This device
              </Text>
              <Text className="text-[13px] font-outfit text-[#67787F]">
                {deviceName} · {deviceLocation}
              </Text>
            </View>
          </View>
          <Text className="text-[14px] font-outfit-semibold text-[#123E7C]">
            Manage
          </Text>
        </Pressable>

        {/* Footer */}
        <View className="mt-auto flex-row items-center justify-between pb-4">
          <View className="flex-row items-center">
            <View className="h-10 w-10 items-center justify-center rounded-full border-2 border-[#F5B400] bg-[#193F7F]">
              <Text className="text-[16px] font-outfit-semibold text-white ">
                J
              </Text>
            </View>
            <View className="ml-3">
              <Text className="text-[15px] font-outfit-semibold text-[#123E7C]">
                JAIZ
              </Text>
              <Text className="text-[12px] font-outfit text-[#67787F]">
                eTOKEN
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-1.5 rounded-full bg-[#E7F7EE] px-3 py-3">
            <View className="h-1.5 w-1.5 rounded-full bg-[#1E8E5A]" />
            <Text className="text-[13px] font-outfit-medium text-[#1E8E5A]">
              Active
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
