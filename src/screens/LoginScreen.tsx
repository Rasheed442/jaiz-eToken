import { LinearGradient } from "expo-linear-gradient";
import { Delete } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type LoginScreenProps = {
  username: string;
  onUsernameChange?: (value: string) => void;
  onLogin: (passcode: string) => void;
  onForgotPasscode: () => void;
};

const PASSCODE_LENGTH = 6;

function PasscodeDots({ length, filled }: { length: number; filled: number }) {
  return (
    <View className="mt-6 mb-4 flex-row items-center justify-center">
      {Array.from({ length }).map((_, i) => {
        const isFilled = i < filled;
        return (
          <View key={i} className="flex-row items-center">
            <View
              className={`h-4 w-4 rounded-full ${
                isFilled ? "bg-[#123E7C]" : "border-2 border-[#D6D6D6]"
              }`}
            />
            {i === 2 && i < length - 1 && (
              <View className="mx-2 h-0.5 w-5 bg-[#D6D6D6]" />
            )}
            {i < length - 1 && i !== 2 && <View className="w-4" />}
          </View>
        );
      })}
    </View>
  );
}

function KeypadButton({
  label,
  onPress,
  icon
}: {
  label?: string;
  onPress: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="h-20 flex-1 items-center justify-center active:opacity-50"
    >
      {icon ? (
        icon
      ) : (
        <Text className="text-[26px] font-outfit-medium text-[#1B2D4A]">
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export default function LoginScreen({
  username,
  onUsernameChange,
  onLogin,
  onForgotPasscode
}: LoginScreenProps) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const initial = username?.trim().charAt(0).toUpperCase() || "?";

  const handleDigitPress = (digit: string) => {
    if (passcode.length >= PASSCODE_LENGTH) return;
    setError(null);

    const next = passcode + digit;
    setPasscode(next);

    if (next.length === PASSCODE_LENGTH) {
      setTimeout(() => {
        onLogin(next);
      }, 150);
    }
  };

  const handleDelete = () => {
    setError(null);
    setPasscode((prev) => prev.slice(0, -1));
  };

  const keypadRows = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"]
  ];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["bottom"]}>
      <LinearGradient
        colors={["#1B2D4A", "#123E7C", "#2C5FA8"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        className="flex justify-center items-center px-6 pb-8 pt-16"
      >
        <SafeAreaView className="flex items-center pb-8 pt-8">
          <View className="h-[84px] w-[84px] flex items-center justify-center rounded-full border-4 border-[#F5B400] bg-white">
            <Text className="text-[32px] font-outfit-semibold text-[#123E7C]">
              {initial}
            </Text>
          </View>

          <Text className="mt-5 text-[26px] text-center font-outfit-semibold text-white">
            Welcome back
          </Text>
          <Text className="mt-1 text-[16px] text-center font-outfit text-[#C7D4E8]">
            Log in to access your eToken
          </Text>
        </SafeAreaView>
      </LinearGradient>

      <View className="flex-1 px-6 pt-6">
        <Text className="text-[14px] font-outfit-medium text-[#1B2D4A]">
          Username / CIF
        </Text>
        <TextInput
          value={username}
          onChangeText={onUsernameChange}
          editable={!!onUsernameChange}
          placeholder="ihsaan"
          placeholderTextColor="#9AA5B1"
          autoCapitalize="none"
          autoCorrect={false}
          className={`mt-2 rounded-2xl bg-[#F0F1F2] px-4 py-4 text-[16px] font-outfit text-[#1B2D4A] ${
            !onUsernameChange ? "opacity-70" : ""
          }`}
        />

        <PasscodeDots length={PASSCODE_LENGTH} filled={passcode.length} />

        {error && (
          <Text className="mt-3 text-center text-[13px] font-outfit-medium text-[#D32F2F]">
            {error}
          </Text>
        )}

        <View className="mt-6 rounded-3xl bg-[#ECEDEE] px-4 pb-4 pt-2">
          {keypadRows.map((row, i) => (
            <View key={i} className="flex-row">
              {row.map((digit) => (
                <KeypadButton
                  key={digit}
                  label={digit}
                  onPress={() => handleDigitPress(digit)}
                />
              ))}
            </View>
          ))}
          <View className="flex-row">
            <View className="h-20 flex-1" />
            <KeypadButton label="0" onPress={() => handleDigitPress("0")} />
            <KeypadButton
              onPress={handleDelete}
              icon={<Delete size={22} color="#1B2D4A" />}
            />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onForgotPasscode}
          className="mt-4 items-center pb-4 active:opacity-70"
        >
          <Text className="text-[15px] font-outfit-semibold text-[#123E7C]">
            Forgot passcode?
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
