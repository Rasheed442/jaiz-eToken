import { registrationApi } from "@/lib/api";
import { authStorage } from "@/lib/auth/storage";
import * as Application from "expo-application";
import * as Device from "expo-device";
import { AlertCircle, ChevronLeft, CheckCircle, Eye, EyeOff, Smartphone } from "lucide-react-native";
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

type DeviceChangeDetailsScreenProps = {
  onBack: () => void;
  onComplete: () => void;
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

function SecureField({
  label,
  value,
  onChangeText,
  showSecure,
  onToggleSecure,
  ...inputProps
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  showSecure: boolean;
  onToggleSecure: () => void;
} & Omit<React.ComponentProps<typeof TextInput>, "secureTextEntry">) {
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
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!showSecure}
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
        <Pressable
          onPress={onToggleSecure}
          className="ml-2 p-2"
          accessibilityLabel={showSecure ? "Hide passcode" : "Show passcode"}
          accessibilityRole="button"
        >
          {showSecure ? (
            <EyeOff size={20} color="#67787F" />
          ) : (
            <Eye size={20} color="#67787F" />
          )}
        </Pressable>
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

function SuccessModal({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <View className="absolute inset-0 z-50 flex items-center justify-center bg-black/40">
      <View className="mx-6 w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <View className="flex-col items-center justify-center">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-[#E6F4EA]">
            <CheckCircle size={32} color="#34A853" />
          </View>
          <View className="flex py-4">
            <Text className="text-[16px] font-outfit-medium text-center text-[#1B2D4A] leading-6">
              {message}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={onDismiss}
          className="mt-4 rounded-2xl bg-[#123E7C] py-3"
        >
          <Text className="text-center text-[16px] font-outfit-semibold text-white">
            OK
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function DeviceChangeDetailsScreen({
  onBack,
  onComplete,
  phoneNumber,
  otp
}: DeviceChangeDetailsScreenProps) {
  const [passcode, setPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [showConfirmPasscode, setShowConfirmPasscode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async () => {
    if (passcode.length !== PASSCODE_LENGTH) {
      setError("Your passcode must be 6 digits.");
      return;
    }
    if (confirmPasscode !== passcode) {
      setError("Passcodes do not match.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let newDeviceId = "";
      if (Platform.OS === "android") {
        newDeviceId = Application.getAndroidId() || "";
      } else if (Platform.OS === "ios") {
        newDeviceId = (await Application.getIosIdForVendorAsync()) || "";
      }
      newDeviceId = newDeviceId || "unknown";

      const payload = {
        username: phoneNumber,
        passcode,
        newDeviceId,
        newDeviceFingerprint: `sha256_${newDeviceId}`,
        newDeviceModel: Device.modelName || Device.deviceName || "Unknown",
        newOsVersion: `${Platform.OS} ${Device.osVersion || ""}`.trim(),
        otp
      };

      const response = await registrationApi.changeDevice(payload);

      if (response.success) {
        // Show success modal with backend message
        setSuccessMessage(response.message || "Device changed successfully.");
        setShowSuccessModal(true);

        // Provision TOTP after successful device change
        const loginPayload = {
          phoneNumber: phoneNumber,
          passcode,
          deviceId: newDeviceId,
          deviceFingerprint: `sha256_${newDeviceId}`,
          useBiometric: false
        };

        const loginResponse = await registrationApi.login(loginPayload);

        if (loginResponse.success && loginResponse.data) {
          const provisionResponse = await registrationApi.provisionToken(
            {
              username: phoneNumber,
              passcode,
              deviceId: newDeviceId
            },
            loginResponse.data.accessToken
          );

          if (provisionResponse.success && provisionResponse.data?.secret) {
            await authStorage.setTotpCredentials({
              secret: provisionResponse.data.secret,
              algorithm: provisionResponse.data.algorithm,
              digits: provisionResponse.data.digits,
              periodSeconds: provisionResponse.data.periodSeconds,
              issuedAt: provisionResponse.data.issuedAt
            });

            await authStorage.setAuthData({
              accessToken: loginResponse.data.accessToken,
              refreshToken: loginResponse.data.refreshToken,
              username: loginResponse.data.username,
              customerName: loginResponse.data.customerName,
              accountNumber: loginResponse.data.accountNumber,
              passcode,
              deviceId: newDeviceId
            });
          }
        }
      } else {
        setError(response.message || "Device change failed. Please try again.");
      }
    } catch (err: any) {
      setError(err?.message || "Device change failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => error && setError(null);

  const digitsOnly = (setter: (v: string) => void) => (t: string) => {
    clearError();
    setter(t.replace(/\D/g, "").slice(0, PASSCODE_LENGTH));
  };

  const handleSuccessDismiss = () => {
    setShowSuccessModal(false);
    onComplete();
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F6F8FA]">
      {showSuccessModal && (
        <SuccessModal
          message={successMessage}
          onDismiss={handleSuccessDismiss}
        />
      )}
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
            Complete device change
          </Text>
          <Text className="mt-2 text-[15px] leading-[22px] font-outfit text-[#67787F]">
            Enter your account details to complete the device change for {phoneNumber}.
          </Text>

          <View className="mt-8 gap-5">
            <SecureField
              label="Passcode"
              value={passcode}
              onChangeText={digitsOnly(setPasscode)}
              placeholder="6 digits"
              keyboardType="number-pad"
              showSecure={showPasscode}
              onToggleSecure={() => setShowPasscode(!showPasscode)}
              maxLength={PASSCODE_LENGTH}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <SecureField
              label="Confirm Passcode"
              value={confirmPasscode}
              onChangeText={digitsOnly(setConfirmPasscode)}
              placeholder="6 digits"
              keyboardType="number-pad"
              showSecure={showConfirmPasscode}
              onToggleSecure={() => setShowConfirmPasscode(!showConfirmPasscode)}
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
              {isLoading ? "Changing device..." : "Change device"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
