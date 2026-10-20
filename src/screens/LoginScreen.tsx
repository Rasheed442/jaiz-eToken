import * as Application from "expo-application";
import { requireOptionalNativeModule } from "expo-modules-core";
import LoadingOverlay from "@/components/LoadingOverlay";
import { LinearGradient } from "expo-linear-gradient";
import { Delete } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { registrationApi } from "../lib/api";
import { authStorage } from "../lib/auth/storage";

type LoginScreenProps = {
  username: string;
  customerName: string;
  onUsernameChange?: (value: string) => void;
  onCustomerNameChange?: (value: string) => void;
  onLogin: () => void;
  onGetStarted: () => void;
  onForgotPasscode: (username: string) => void;
  onOpenMetaMapPlayground?: () => void;
};

const PASSCODE_LENGTH = 6;
const BIOMETRIC_FACIAL_RECOGNITION = 2;
const BIOMETRIC_FINGERPRINT = 1;

function hasLocalAuthenticationNativeModule(): boolean {
  try {
    return Boolean(
      requireOptionalNativeModule("ExpoLocalAuthentication")
    );
  } catch {
    return false;
  }
}

function getBiometricFailureMessage(error: string): string {
  switch (error) {
    case "missing_usage_description":
      return "Face ID permission is missing from this app build. Install a newly built iOS app to use Face ID.";
    case "user_cancel":
    case "system_cancel":
    case "app_cancel":
      return "Biometric login was cancelled. Try again when you're ready.";
    case "not_enrolled":
      return "No biometrics are enrolled on this device. Set up Face ID or fingerprint in device settings.";
    case "lockout":
      return "Biometric authentication is temporarily locked. Try again later or use your passcode.";
    case "not_available":
      return "Biometric authentication is currently unavailable on this device.";
    default:
      return "Biometric authentication failed. Try again or use your passcode.";
  }
}

function getLoginFailureMessage(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (!value || typeof value !== "object")
    return "Login failed. Please try again.";

  const response = value as Record<string, unknown>;
  const message = [
    response.message,
    response.errorMessage,
    response.description,
    response.errorDescription
  ].find(
    (item): item is string => typeof item === "string" && item.trim().length > 0
  );
  if (message) return message.trim();

  if (response.data !== undefined && response.data !== value) {
    const nestedMessage = getLoginFailureMessage(response.data);
    if (nestedMessage !== "Login failed. Please try again.")
      return nestedMessage;
  }

  const errorCode = [response.errorCode, response.code].find(
    (item): item is string => typeof item === "string" && item.trim().length > 0
  );
  if (errorCode) return errorCode.trim();

  try {
    const rawResponse = JSON.stringify(value, null, 2);
    return rawResponse && rawResponse !== "{}"
      ? rawResponse
      : "Login failed. Please try again.";
  } catch {
    return "Login failed. Please try again.";
  }
}

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

/* ---------- Screen ---------- */

export default function LoginScreen({
  username,
  customerName,
  onUsernameChange,
  onCustomerNameChange,
  onLogin,
  onGetStarted,
  onForgotPasscode,
  onOpenMetaMapPlayground
}: LoginScreenProps) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [Checkusername, seChecktUsername] = useState("");
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState("biometrics");
  const [biometricMessage, setBiometricMessage] = useState("");
  const [localAuthentication, setLocalAuthentication] = useState<
    typeof import("expo-local-authentication") | null
  >(null);

  useEffect(() => {
    let isMounted = true;

    const checkBiometricSupport = async () => {
      try {
        const savedPreference = await authStorage.getBiometricEnabled();
        if (!isMounted) return;
        setBiometricEnabled(savedPreference);

        if (!hasLocalAuthenticationNativeModule()) {
          setBiometricMessage(
            "Biometric login is not included in this app build. Install an updated app build to use it."
          );
          return;
        }

        const module = await import("expo-local-authentication");
        if (!isMounted) return;
        setLocalAuthentication(module);

        const [hasHardware, isEnrolled, types] = await Promise.all([
          module.hasHardwareAsync(),
          module.isEnrolledAsync(),
          module.supportedAuthenticationTypesAsync()
        ]);
        if (!isMounted) return;

        setBiometricAvailable(hasHardware && isEnrolled && types.length > 0);

        const hasFace = types.includes(
          BIOMETRIC_FACIAL_RECOGNITION
        );
        const hasFingerprint = types.includes(
          BIOMETRIC_FINGERPRINT
        );
        if (Platform.OS === "ios") {
          setBiometricLabel(
            hasFace ? "Face ID" : hasFingerprint ? "Touch ID" : "biometrics"
          );
        } else if (hasFace && hasFingerprint) {
          setBiometricLabel("face recognition or fingerprint");
        } else if (hasFace) {
          setBiometricLabel("face recognition");
        } else if (hasFingerprint) {
          setBiometricLabel("fingerprint");
        }

        if (!hasHardware) {
          setBiometricMessage("This device does not support biometric authentication.");
        } else if (!isEnrolled || types.length === 0) {
          setBiometricMessage("Set up Face ID, face recognition, or a fingerprint in your device settings to use biometrics.");
        } else {
          setBiometricMessage("");
        }
      } catch {
        if (!isMounted) return;
        setBiometricAvailable(false);
        setBiometricMessage(
          "Biometric login is not included in this app build. Install an updated app build to use it."
        );
      }
    };

    void checkBiometricSupport();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const rememberedUsername = await authStorage.getUsername();

      if (rememberedUsername) {
        seChecktUsername(rememberedUsername);
      }
    };
    checkAuthStatus();
  }, []);

  const nameParts = customerName.trim().split(/\s+/).filter(Boolean);
  const initial = nameParts.length > 1
    ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
    : nameParts[0]?.[0]?.toUpperCase() || "J";

  const handleDigitPress = async (digit: string) => {
    if (passcode.length >= PASSCODE_LENGTH) return;
    setError(null);

    const next = passcode + digit;
    setPasscode(next);

    if (next.length === PASSCODE_LENGTH) {
      // Wait a bit for the UI to update, then call login API
      setTimeout(async () => {
        await handleLogin(next);
      }, 150);
    }
  };

  const handleLogin = async (passcodeToSubmit: string, useBiometric = false) => {
    if (isLoading) return;

    if (!username.trim()) {
      setError("Phone number is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get device ID
      let deviceId = "";
      if (Platform.OS === "android") {
        deviceId = Application.getAndroidId() || "";
      } else if (Platform.OS === "ios") {
        deviceId = (await Application.getIosIdForVendorAsync()) || "";
      }

      const deviceFingerprint = "sha256_" + deviceId;

      const payload = {
        phoneNumber: username.trim(),
        passcode: passcodeToSubmit,
        deviceId,
        deviceFingerprint,
        useBiometric
      };

      const response = await registrationApi.login(payload);

      if (response.success && response.data) {
        // Store authentication data
        await authStorage.setAuthData({
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          username: response.data.username,
          customerName: response.data.customerName,
          accountNumber: response.data.accountNumber,
          passcode: passcodeToSubmit,
          deviceId
        });

        // Remember username
        if (onUsernameChange) {
          onUsernameChange(response.data.username);
        }
        onCustomerNameChange?.(response.data.customerName);

        // Call onLogin callback to navigate to dashboard
        onLogin();
      } else {
        setError(getLoginFailureMessage(response));
        setPasscode("");
      }
    } catch (err: any) {
      console.error("Login failed:", err?.message ?? err);
      setError(getLoginFailureMessage(err?.data ?? err));
      setPasscode("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricToggle = async () => {
    try {
      if (biometricEnabled) {
        await authStorage.setBiometricEnabled(false);
        await authStorage.clearPasscode();
        setBiometricEnabled(false);
        setBiometricMessage("");
        return;
      }

      if (!hasLocalAuthenticationNativeModule() || !localAuthentication) {
        const message =
          "Biometric login is not included in this app build. Install an updated app build to use it.";
        setBiometricMessage(message);
        Alert.alert("Biometrics unavailable", message);
        return;
      }

      if (!biometricAvailable) {
        const message = biometricMessage ||
          "Set up Face ID, face recognition, or a fingerprint in your device settings to use biometric login.";
        setBiometricMessage(message);
        Alert.alert("Biometrics unavailable", message);
        return;
      }

      const result = await localAuthentication.authenticateAsync({
        promptMessage: `Enable ${biometricLabel} for Jaiz eToken`,
        cancelLabel: "Cancel",
        disableDeviceFallback: true
      });
      if (!result.success) {
        console.info("Biometric enrollment prompt did not succeed:", result.error);
        setBiometricMessage(getBiometricFailureMessage(result.error));
        return;
      }

      await authStorage.setBiometricEnabled(true);
      setBiometricEnabled(true);
      setBiometricMessage("Biometric login is enabled on this device.");
    } catch {
      setBiometricMessage("Could not update biometric login. Please try again.");
    }
  };

  const handleBiometricLogin = async () => {
    console.info("Biometric login tapped", {
      biometricAvailable,
      nativeModuleAvailable: hasLocalAuthenticationNativeModule(),
      isLoading
    });
    if (!biometricAvailable || isLoading) {
      console.warn("Biometric login skipped because the feature is unavailable or busy.");
      return;
    }

    try {
      if (!hasLocalAuthenticationNativeModule() || !localAuthentication) {
        setError("Biometric login is not included in this app build. Install an updated app build to use it.");
        return;
      }

      const result = await localAuthentication.authenticateAsync({
        promptMessage: `Log in with ${biometricLabel}`,
        cancelLabel: "Cancel",
        disableDeviceFallback: true
      });
      if (!result.success) {
        console.info("Biometric login prompt did not succeed:", result.error);
        setError(getBiometricFailureMessage(result.error));
        return;
      }

      const savedPasscode = await authStorage.getPasscode();
      if (!savedPasscode) {
        setError("Enter your passcode once before using biometric login.");
        return;
      }

      await handleLogin(savedPasscode, true);
    } catch (authenticationError) {
      console.error("Biometric login failed:", authenticationError);
      setError("Biometric authentication could not be completed. Please try again.");
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
            Hello{customerName.trim() ? `, ${customerName.trim()}` : ""}
          </Text>
          <Text className="mt-1 text-[16px] text-center font-outfit text-[#C7D4E8]">
            Log in to access your eToken
          </Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ flexGrow: 1, paddingTop: 24, paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {Checkusername ? (
          ""
        ) : (
          <Text className="text-[14px] font-outfit-medium text-[#1B2D4A]">
            Phone Number
          </Text>
        )}
        {Checkusername ? (
          ""
        ) : (
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
        )}

        <PasscodeDots length={PASSCODE_LENGTH} filled={passcode.length} />

        <View className="mt-1 mb-2 flex-row items-center justify-between rounded-2xl bg-[#F5F7FA] px-4 py-3">
          <View className="mr-4 flex-1">
            <Text className="text-[14px] font-outfit-semibold text-[#1B2D4A]">
              Biometric login
            </Text>
            <Text className="mt-0.5 text-[12px] font-outfit text-[#67787F]">
              {biometricMessage || `Use ${biometricLabel} to log in`}
            </Text>
          </View>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{
              checked: biometricEnabled,
              disabled: !biometricEnabled && (!localAuthentication || !biometricAvailable)
            }}
            accessibilityLabel="Enable biometric login"
            onPress={() => void handleBiometricToggle()}
            disabled={!biometricEnabled && (!localAuthentication || !biometricAvailable)}
            className={`h-8 w-14 justify-center rounded-full px-1 ${biometricEnabled ? "bg-[#123E7C]" : "bg-[#C9CED6]"}`}
          >
            <View className={`h-6 w-6 rounded-full bg-white ${biometricEnabled ? "self-end" : "self-start"}`} />
          </Pressable>
        </View>

        {biometricEnabled && biometricAvailable ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => void handleBiometricLogin()}
            disabled={isLoading}
            className="mb-2 items-center rounded-2xl border border-[#123E7C] py-3 active:opacity-70"
          >
            <Text className="text-[15px] font-outfit-semibold text-[#123E7C]">
              Log in with {biometricLabel}
            </Text>
          </Pressable>
        ) : null}

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
          onPress={() => onForgotPasscode(username)}
          className="mt-4 items-center pb-4 active:opacity-70"
        >
          <Text className="text-[15px] font-outfit-semibold text-[#123E7C]">
            Forgot passcode?
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={onGetStarted}
          className="mt-2 items-center rounded-2xl border border-[#123E7C] py-4 active:opacity-70"
        >
          <Text className="text-[15px] font-outfit-semibold text-[#123E7C]">
            Get started
          </Text>
        </Pressable>

        {/* {__DEV__ && onOpenMetaMapPlayground ? (
          <Pressable
            accessibilityRole="button"
            onPress={onOpenMetaMapPlayground}
            className="mt-4 items-center py-2 active:opacity-70"
          >
            <Text className="text-[14px] font-outfit-medium text-[#67787F]">
              MetaMap playground
            </Text>
          </Pressable>
        ) : null} */}
      </ScrollView>

      <LoadingOverlay visible={isLoading} />
    </SafeAreaView>
  );
}
