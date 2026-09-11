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

type OtpVerificationScreenProps = {
  onBack: () => void;
  onVerifyComplete?: () => void;
};

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel="Go back"
      accessibilityRole="button"
      className="h-11 w-11 items-center justify-center rounded-full bg-[#E7E9EC] active:opacity-70"
      onPress={onPress}
    >
      <Text className="text-[28px] leading-6 text-[#1B2D4A]">‹</Text>
    </Pressable>
  );
}

const otpLength = 6;

export default function OtpVerificationScreen({
  onBack,
  onVerifyComplete
}: OtpVerificationScreenProps) {
  const [code, setCode] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(56);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (secondsLeft <= 0) return;

    const timer = setTimeout(() => setSecondsLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const digits = Array.from(
    { length: otpLength },
    (_, index) => code[index] ?? ""
  );
  const isComplete = code.length === otpLength;

  const handleChange = (value: string) => {
    const nextValue = value.replace(/[^0-9]/g, "").slice(0, otpLength);
    setCode(nextValue);
  };

  const focusIndex = Math.min(code.length, otpLength - 1);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F3F5F7]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-10 pt-12"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-10 flex-row items-center justify-between">
          <View className="w-[44px]" />
          <Text className="text-[32px] font-medium text-[#1B2D4A]">9:41</Text>
          <Text className="text-[22px] text-[#1B2D4A]">◔◔</Text>
        </View>

        <View className="mb-8 flex-row items-center">
          <BackButton onPress={onBack} />
          <View className="ml-3 mr-2 h-2.5 flex-1 overflow-hidden rounded-full bg-[#D7DDE5]">
            <View className="h-full w-[60%] rounded-full bg-[#123E7C]" />
          </View>
        </View>

        <Text className="text-[36px] font-medium text-[#1B2D4A]">
          Enter code
        </Text>
        <Text className="mt-3 text-[15px] leading-6 text-[#7A8795]">
          We sent a 6-digit code to +234 801 •••• 45
        </Text>

        <View className="mt-8 flex-row items-center justify-between">
          {digits.map((digit, index) => {
            const isFilled = !!digit;
            const isFocused = index === focusIndex && !isFilled;

            return (
              <Pressable
                key={index}
                onPress={() => inputRefs.current[index]?.focus()}
                className={[
                  "h-[72px] w-[48px] items-center justify-center rounded-2xl border bg-[#E9EDF2]",
                  isFilled
                    ? "border-[#123E7C] bg-[#F3F7FF]"
                    : "border-[#D6DCE5]",
                  isFocused ? "border-[#123E7C]" : ""
                ].join(" ")}
              >
                <Text className="text-[32px] font-bold text-[#1B2D4A]">
                  {digit}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          autoFocus
          value={code}
          onChangeText={handleChange}
          keyboardType="number-pad"
          maxLength={otpLength}
          textContentType="oneTimeCode"
          style={{ position: "absolute", opacity: 0, width: 1, height: 1 }}
          ref={(ref) => {
            inputRefs.current[0] = ref;
          }}
        />

        <Pressable
          className="mt-8 items-center justify-center rounded-2xl border border-[#C3CAD4] bg-[#EEF2F6] px-4 py-4"
          onPress={() => setCode("")}
        >
          <Text className="text-[18px] font-semibold text-[#1B2D4A]">
            Resend code in 00:{String(secondsLeft).padStart(2, "0")}
          </Text>
        </Pressable>

        <View className="mt-14">
          <Pressable
            className={`items-center rounded-[28px] bg-[#123E7C] px-5 py-5 ${!isComplete ? "opacity-60" : ""}`}
            disabled={!isComplete}
            onPress={() => {
              if (isComplete && onVerifyComplete) {
                onVerifyComplete();
              }
            }}
          >
            <View className="flex-row items-center justify-center">
              <Text className="text-[24px] font-semibold text-white">
                Verify
              </Text>
              <Text className="ml-2 text-[28px] font-light text-white">›</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
