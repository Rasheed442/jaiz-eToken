import { ChevronLeft, Delete } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type CreateProfileScreenProps = {
  onBack: () => void;
  onProfileCreated: (data: { username: string; passcode: string }) => void;
  originalPasscode: string; // the passcode set in step 1, to confirm against here
  progress?: number; // 0-1, for the top progress bar
};

const PASSCODE_LENGTH = 6;

function ProgressBar({ progress }: { progress: number }) {
  return (
    <View className="h-2.5 w-full overflow-hidden rounded-full bg-[#E0E0E0]">
      <View
        className="h-full rounded-full bg-[#123E7C]"
        style={{ width: `${Math.min(1, Math.max(0, progress)) * 100}%` }}
      />
    </View>
  );
}

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel="Go back"
      accessibilityRole="button"
      className="h-10 w-10 items-center justify-center rounded-xl bg-[#E8E8E8] active:opacity-70"
      onPress={onPress}
    >
      <ChevronLeft size={22} color="#1B2D4A" />
    </Pressable>
  );
}

function PasscodeDots({ length, filled }: { length: number; filled: number }) {
  return (
    <View className="mt-4 flex-row items-start justify-start">
      {Array.from({ length }).map((_, i) => {
        const isFilled = i < filled;
        return (
          <View key={i} className="flex-row items-center">
            <View
              className={`h-4 w-4 rounded-full ${
                isFilled ? "bg-[#123E7C]" : "bg-[#D6D6D6]"
              }`}
            />
            {i === 2 && i < length - 1 && (
              <View className="mx-2 h-1 w-5 bg-[#D6D6D6]" />
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
      className="h-20 flex-1 items-center justify-center active:opacity-70"
    >
      {icon ? icon : (
        <Text className="text-[28px] font-outfit-medium text-[#1B2D4A]">
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export default function CreateProfileScreen({
  onBack,
  onProfileCreated,
  originalPasscode,
  progress = 0.33
}: CreateProfileScreenProps) {
  const [username, setUsername] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleDigitPress = (digit: string) => {
    if (confirmPasscode.length >= PASSCODE_LENGTH) return;
    setError(null);

    const next = confirmPasscode + digit;
    setConfirmPasscode(next);

    if (next.length === PASSCODE_LENGTH) {
      if (next === originalPasscode) {
        setTimeout(() => {
          onProfileCreated({ username, passcode: next });
        }, 200);
      } else {
        setTimeout(() => {
          setError("Passcodes don't match. Try again.");
          setConfirmPasscode("");
        }, 200);
      }
    }
  };

  const handleDelete = () => {
    setError(null);
    setConfirmPasscode((prev) => prev.slice(0, -1));
  };

  const keypadRows = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"]
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#F3F5F7]">
      <View className="flex-1 px-6 pb-6">
        <View className="flex-row items-center pt-6">
          <BackButton onPress={onBack} />
          <View className="ml-3 flex-1">
            <ProgressBar progress={progress} />
          </View>
        </View>

        <Text className="mt-7 text-[26px] font-outfit-semibold text-[#1B2D4A]">
          Create your profile
        </Text>
        <Text className="mt-2 text-[15px] font-outfit text-[#67787F]">
          Choose a username and a 6-digit passcode to protect your token.
        </Text>

        <Text className="mt-8 text-[14px] font-outfit-medium text-[#1B2D4A]">
          Username
        </Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="Enter a username"
          placeholderTextColor="#9AA5B1"
          autoCapitalize="none"
          autoCorrect={false}
          className="mt-2 rounded-2xl bg-[#E8E8E8] px-4 py-4 text-[16px] font-outfit text-[#1B2D4A]"
        />

        <View className="mt-8 flex-row items-center justify-between">
          <Text className="text-[14px] font-outfit-medium text-[#1B2D4A]">
            Confirm 6-digit passcode
          </Text>
          <View className="rounded-full border border-gray-100 bg-[#F2F2F4] px-3 py-1">
            <Text className="text-[12px] font-outfit-medium text-[#67787F]">
              Step 2 of 2
            </Text>
          </View>
        </View>

        <PasscodeDots length={PASSCODE_LENGTH} filled={confirmPasscode.length} />

        {error && (
          <Text className="mt-5 text-center text-[13px] font-outfit-light text-[#D32F2F]">
            {error}
          </Text>
        )}

        <View className="mt-auto rounded-3xl bg-[#E8E8E8] px-4 pb-4 pt-2">
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
      </View>
    </SafeAreaView>
  );
}