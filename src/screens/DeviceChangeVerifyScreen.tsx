import { registrationApi } from "@/lib/api";
import { AlertCircle, ChevronLeft, Smartphone } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PASSCODE_LENGTH = 6;
const OTP_LENGTH = 6;

type DeviceChangeVerifyScreenProps = {
  onBack: () => void;
  onNext: (changeToken: string, securityQuestions: Array<{ id: number; question: string }>) => void;
  phoneNumber: string;
  otp: string;
};

function Field({
  label,
  ...inputProps
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  const [focused, setFocused] = useState(false);

  return (
    <View>
      <Text className="mb-2 text-[14px] font-outfit-medium text-[#1B2D4A]">{label}</Text>
      <View
        className={`h-[52px] flex-row items-center rounded-xl border bg-white px-4 ${
          focused ? "border-[#123E7C]" : "border-[#DDE3EA]"
        }`}
      >
        <TextInput
          {...inputProps}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
          placeholderTextColor="#9AA5B1"
          className="flex-1 text-[16px] font-outfit text-[#1B2D4A]"
        />
      </View>
    </View>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <View
      accessibilityRole="alert"
      className="mt-5 flex-row items-start rounded-xl border border-[#F0B4B4] bg-[#FDECEC] px-4 py-3"
    >
      <AlertCircle size={18} color="#B3261E" style={{ marginTop: 1 }} />
      <Text className="ml-2.5 flex-1 text-[13px] leading-[18px] font-outfit-medium text-[#B3261E]">
        {message}
      </Text>
    </View>
  );
}

export default function DeviceChangeVerifyScreen({
  onBack,
  onNext,
  phoneNumber,
  otp
}: DeviceChangeVerifyScreenProps) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (passcode.length !== PASSCODE_LENGTH) {
      setError("Your passcode must be 6 digits.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await registrationApi.verifyDeviceChange({
        username: phoneNumber,
        passcode,
        otp
      });

      if (response.success && response.data) {
        onNext(response.data.changeToken, response.data.securityQuestions);
      } else {
        setError(response.message || "Verification failed. Please try again.");
      }
    } catch (err: any) {
      setError(err?.message || "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => error && setError(null);

  const digitsOnly = (setter: (v: string) => void) => (t: string) => {
    clearError();
    setter(t.replace(/\D/g, "").slice(0, PASSCODE_LENGTH));
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F6F8FA]">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-row items-center px-6 pt-4">
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center rounded-full border border-[#DDE3EA] bg-white active:opacity-70"
            onPress={onBack}
          >
            <ChevronLeft size={22} color="#1B2D4A" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View className="h-12 w-12 items-center justify-center rounded-xl bg-[#E6EDF7]">
            <Smartphone size={24} color="#123E7C" />
          </View>
          <Text className="mt-5 text-[26px] leading-[32px] font-outfit-semibold text-[#1B2D4A]">
            Verify your identity
          </Text>
          <Text className="mt-2 text-[15px] leading-[22px] font-outfit text-[#67787F]">
            Enter your passcode to continue the device change for {phoneNumber}.
          </Text>

          <View className="mt-8 gap-5">
            <Field
              label="Passcode"
              value={passcode}
              onChangeText={digitsOnly(setPasscode)}
              placeholder="6 digits"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={PASSCODE_LENGTH}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {error && <ErrorBanner message={error} />}
        </ScrollView>

        <View className="border-t border-[#E3E8EE] px-6 pb-4 pt-4">
          <Pressable
            accessibilityRole="button"
            onPress={handleSubmit}
            disabled={isLoading}
            className={`h-14 flex-row items-center justify-center rounded-2xl bg-[#123E7C] active:opacity-85 ${
              isLoading ? "opacity-70" : ""
            }`}
          >
            {isLoading && <ActivityIndicator size="small" color="#FFFFFF" />}
            <Text
              className={`text-[17px] font-outfit-semibold text-white ${isLoading ? "ml-3" : ""}`}
            >
              {isLoading ? "Verifying..." : "Continue"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
