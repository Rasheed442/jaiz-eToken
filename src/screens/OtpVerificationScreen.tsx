import { ChevronLeft } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import Animated, { SlideInLeft } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeToggleButton, useAppTheme } from "@/lib/theme";

type OtpVerificationScreenProps = {
  onBack: () => void;
  onVerifyComplete?: () => void;
  phoneNumber?: string;
};

const OTP_LENGTH = 6;

function BackButton({ onPress }: { onPress: () => void }) {
  const { isDark } = useAppTheme();
  return (
    <Pressable
      accessibilityLabel="Go back"
      accessibilityRole="button"
      className="h-10 w-10 items-center justify-center rounded-xl bg-[#ecedee] dark:bg-[#1E2D4A] active:opacity-70"
      onPress={onPress}
    >
      <ChevronLeft size={22} color={isDark ? "#FFFFFF" : "#000000"} />
    </Pressable>
  );
}

function OtpInput({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<TextInput>(null);
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? "");

  return (
    <Pressable
      className="relative flex-row items-center justify-between"
      onPress={() => inputRef.current?.focus()}
    >
      {digits.map((digit, index) => {
        const isActive = index === value.length;
        const isFilled = digit !== "";

        return (
          <View
            key={index}
            className={[
              "h-[72px] w-[48px] items-center justify-center rounded-2xl border-2",
              isFilled
                ? "border-transparent bg-white dark:bg-[#131F35]"
                : isActive
                  ? "border-[#123E7C] dark:border-[#60A5FA] bg-white dark:bg-[#131F35]"
                  : "border-transparent bg-[#E9EDF2] dark:bg-[#1E2D4A]"
            ].join(" ")}
          >
            <Text className="text-[32px] font-outfit-bold text-[#1B2D4A] dark:text-white">
              {digit ? "*" : ""}
            </Text>
          </View>
        );
      })}

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) =>
          onChange(text.replace(/[^0-9]/g, "").slice(0, OTP_LENGTH))
        }
        keyboardType="number-pad"
        maxLength={OTP_LENGTH}
        autoFocus
        caretHidden
        className="absolute inset-0 opacity-0"
      />
    </Pressable>
  );
}

export default function OtpVerificationScreen({
  onBack,
  onVerifyComplete,
  phoneNumber = "+234 801 •••• 45"
}: OtpVerificationScreenProps) {
  const [otpCode, setOtpCode] = useState("");
  const [resendSeconds, setResendSeconds] = useState(56);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (resendSeconds <= 0) return;

    const timer = setTimeout(() => setResendSeconds((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendSeconds]);

  const isOtpComplete = otpCode.length === OTP_LENGTH;
  const resendLabel =
    resendSeconds > 0
      ? `Resend code in 00:${String(resendSeconds).padStart(2, "0")}`
      : "Resend code";

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F3F5F7] dark:bg-[#070E1E]"
      style={{ paddingBottom: insets.bottom }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-10 pt-14"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center justify-between pt-6">
          <BackButton onPress={onBack} />
          <ThemeToggleButton />
        </View>

        <Animated.View entering={SlideInLeft.duration(400).springify()}>
          <Text className="mt-7 text-[26px] font-outfit-semibold text-[#1B2D4A] dark:text-white">
            Enter code
          </Text>
          <Text className="mt-2 text-[15px] font-outfit text-[#67787F] dark:text-[#94A3B8]">
            We sent a 6-digit code to {phoneNumber}
          </Text>

          <View className="mt-8">
            <OtpInput value={otpCode} onChange={setOtpCode} />
          </View>

          <Pressable
            disabled={resendSeconds > 0}
            className={[
              "mt-8 items-center justify-center rounded-3xl border-2 border-[#D4DFFD] dark:border-[#2A3D63] bg-[#EEF2F6] dark:bg-[#131F35] px-4 py-4",
              resendSeconds > 0 ? "opacity-80" : ""
            ].join(" ")}
            onPress={() => {
              setOtpCode("");
              setResendSeconds(56);
              // TODO: trigger the actual resend request here.
            }}
          >
            <Text className="text-[18px] font-outfit-semibold text-[#193F7F] dark:text-[#60A5FA]">
              {resendLabel}
            </Text>
          </Pressable>

          <View className="mt-5">
            <Pressable
              accessibilityRole="button"
              className={[
                "flex-row items-center justify-center rounded-[28px] bg-[#123E7C] px-5 py-3 active:opacity-80",
                !isOtpComplete ? "opacity-60" : ""
              ].join(" ")}
              disabled={!isOtpComplete}
              onPress={() => {
                if (isOtpComplete && onVerifyComplete) {
                  onVerifyComplete();
                }
              }}
            >
              <Text className="text-[22px] font-outfit-semibold text-white">
                Verify
              </Text>
              <Text className="ml-2 text-[28px] font-light text-white">›</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
