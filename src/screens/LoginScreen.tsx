import LoadingOverlay from "@/components/LoadingOverlay";
import * as Application from "expo-application";
import { LinearGradient } from "expo-linear-gradient";
import { requireOptionalNativeModule } from "expo-modules-core";
import { Delete, Fingerprint } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  BackHandler,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets
} from "react-native-safe-area-context";
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
  onDeviceNotRegistered?: (username: string) => void;
  onDeviceChangeFlow?: (phoneNumber: string) => void;
};

const PASSCODE_LENGTH = 6;
const BIOMETRIC_FACIAL_RECOGNITION = 2;
const BIOMETRIC_FINGERPRINT = 1;

const BLUE = "#064783";
const BLUE_INK = "#123E7C";
const GOLD = "#FFB900";

function hasLocalAuthenticationNativeModule(): boolean {
  try {
    return Boolean(requireOptionalNativeModule("ExpoLocalAuthentication"));
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

function safeStringify(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value) ?? "";
  } catch {
    return "";
  }
}

/**
 * Detects the "device not registered / device conflict" error wherever the
 * backend or API client puts it: top-level code or message, nested `data`,
 * `response.data`, an Error's message, or a plain string.
 */
function isDeviceNotRegisteredError(value: unknown): boolean {
  const source = value as
    | { message?: unknown; data?: unknown; response?: { data?: unknown } }
    | null
    | undefined;

  const text = [
    safeStringify(value),
    typeof source?.message === "string" ? source.message : "",
    safeStringify(source?.data),
    safeStringify(source?.response?.data)
  ].join(" ");

  if (!text.trim()) return false;

  // Error codes, e.g. DEVICE_NOT_REGISTERED / DEVICE_CONFLICT
  if (/DEVICE[_\s-]?(NOT[_\s-]?REGISTERED|CONFLICT)/i.test(text)) return true;

  // Human-readable messages
  return (
    /device/i.test(text) &&
    /(not registered|unregistered|not recognized|unknown device|another device|linked to another)/i.test(
      text
    )
  );
}

function PasscodeDots({ length, filled }: { length: number; filled: number }) {
  return (
    <View
      accessibilityLabel={`${filled} of ${length} digits entered`}
      className="my-5 flex-row items-center justify-center"
    >
      {Array.from({ length }).map((_, i) => {
        const isFilled = i < filled;
        return (
          <View key={i} className="flex-row items-center">
            <View
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                borderWidth: isFilled ? 0 : 2,
                borderColor: "#C9D3DF",
                backgroundColor: isFilled ? BLUE : "transparent",
                transform: [{ scale: isFilled ? 1.1 : 1 }]
              }}
            />
            {i < length - 1 && (
              <Text
                accessibilityElementsHidden
                className="mx-1 text-[15px] font-outfit-medium text-[#AAB6C5]"
              >
                -
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

function KeypadButton({
  label,
  onPress,
  icon,
  height
}: {
  label?: string;
  onPress: () => void;
  icon?: React.ReactNode;
  height: number;
}) {
  const keySize = Math.min(height - 8, 66);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label ?? "Delete last passcode digit"}
      onPress={onPress}
      className="flex-1 items-center justify-center"
      style={{ height }}
    >
      {({ pressed }) => (
        <View
          style={{
            width: keySize,
            height: keySize,
            borderRadius: keySize / 2,
            alignItems: "center",
            justifyContent: "center",
            // Digit keys are white discs; the delete key stays flat.
            backgroundColor: icon
              ? pressed
                ? "#E3E9F1"
                : "transparent"
              : pressed
                ? "#DCE6F4"
                : "#FFFFFF",
            shadowColor: "#0A3155",
            shadowOpacity: icon || pressed ? 0 : 0.08,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
            elevation: icon || pressed ? 0 : 1
          }}
        >
          {icon ? (
            icon
          ) : (
            <Text className="text-[26px] font-outfit-medium text-[#12294A]">
              {label}
            </Text>
          )}
        </View>
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
  onOpenMetaMapPlayground,
  onDeviceNotRegistered,
  onDeviceChangeFlow
}: LoginScreenProps) {
  const [passcode, setPasscode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(username);
  const [showPhoneField, setShowPhoneField] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnablingBiometric, setIsEnablingBiometric] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState("biometrics");
  const [biometricMessage, setBiometricMessage] = useState("");
  const [localAuthentication, setLocalAuthentication] = useState<
    typeof import("expo-local-authentication") | null
  >(null);
  const [showDeviceConflictModal, setShowDeviceConflictModal] = useState(false);
  const [deviceConflictPhoneNumber, setDeviceConflictPhoneNumber] = useState("");
  const [isInitiatingDeviceChange, setIsInitiatingDeviceChange] = useState(false);
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = screenHeight < 760;
  const keypadRowHeight = compact ? 62 : 76;
  const headerHeight = Math.min(440, Math.max(260, screenHeight * 0.29));

  useEffect(() => {
    let isMounted = true;

    // Check if username is stored to determine if we should show phone field
    const checkStoredUsername = async () => {
      if (!isMounted) return;
      const storedUsername = await authStorage.getUsername();
      setShowPhoneField(!storedUsername || storedUsername.trim() === "");
      if (storedUsername) {
        setPhoneNumber(storedUsername);
      }
    };

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

        const hasFace = types.includes(BIOMETRIC_FACIAL_RECOGNITION);
        const hasFingerprint = types.includes(BIOMETRIC_FINGERPRINT);
        if (Platform.OS === "ios") {
          setBiometricLabel(
            hasFace ? "Face ID" : hasFingerprint ? "Touch ID" : "biometrics"
          );
        } else if (hasFace && hasFingerprint) {
          setBiometricLabel("Biometrics");
        } else if (hasFace) {
          setBiometricLabel("Biometrics");
        } else if (hasFingerprint) {
          setBiometricLabel("Biometric");
        }

        if (!hasHardware) {
          setBiometricMessage(
            "This device does not support biometric authentication."
          );
        } else if (!isEnrolled || types.length === 0) {
          setBiometricMessage(
            "Set up Face ID, face recognition, or a fingerprint in your device settings to use biometrics."
          );
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

    void checkStoredUsername();
    void checkBiometricSupport();
    return () => {
      isMounted = false;
    };
  }, []);

  // Android back button closes the device-conflict prompt instead of leaving the screen
  useEffect(() => {
    if (!showDeviceConflictModal) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      setShowDeviceConflictModal(false);
      setDeviceConflictPhoneNumber("");
      return true;
    });
    return () => subscription.remove();
  }, [showDeviceConflictModal]);

  const nameParts = customerName.trim().split(/\s+/).filter(Boolean);
  const initial =
    nameParts.length > 1
      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
      : nameParts[0]?.[0]?.toUpperCase() || "J";

  const showDeviceConflict = (phone: string) => {
    setDeviceConflictPhoneNumber(phone);
    setShowDeviceConflictModal(true);
    setPasscode("");
    setError(null);
  };

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

  const handleLogin = async (
    passcodeToSubmit: string,
    useBiometric = false
  ) => {
    if (isLoading) return;

    const phoneToUse = showPhoneField ? phoneNumber : username;
    if (!phoneToUse.trim()) {
      setError("Phone number is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get device ID - check storage first, then generate if not present
      let deviceId = await authStorage.getDeviceId();
      if (!deviceId) {
        if (Platform.OS === "android") {
          deviceId = Application.getAndroidId() || "";
        } else if (Platform.OS === "ios") {
          deviceId = (await Application.getIosIdForVendorAsync()) || "";
        }
        // Store the device ID for future use
        if (deviceId) {
          await authStorage.setAuthData({
            accessToken: (await authStorage.getAccessToken()) || "",
            refreshToken: (await authStorage.getRefreshToken()) || "",
            username: phoneToUse,
            customerName: (await authStorage.getCustomerName()) || "",
            accountNumber: (await authStorage.getAccountNumber()) || "",
            deviceId
          });
        }
      }

      const deviceFingerprint = "sha256_" + (deviceId || "unknown");

      const payload = {
        phoneNumber: phoneToUse.trim(),
        passcode: passcodeToSubmit,
        deviceId: deviceId || "unknown",
        deviceFingerprint,
        useBiometric
      };

      const response = await registrationApi.login(payload);

      if (response.success && response.data) {
        await authStorage.setDeviceLastUsedAt(new Date().toISOString());

        // Store authentication data
        await authStorage.setAuthData({
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          username: response.data.username,
          customerName: response.data.customerName,
          accountNumber: response.data.accountNumber,
          passcode: passcodeToSubmit,
          deviceId: deviceId || undefined
        });

        // Remember username
        if (onUsernameChange) {
          onUsernameChange(response.data.username);
        }
        onCustomerNameChange?.(response.data.customerName);

        // Call onLogin callback to navigate to dashboard
        onLogin();
      } else {
        console.log("Login response:", safeStringify(response));
        if (isDeviceNotRegisteredError(response)) {
          showDeviceConflict(phoneToUse.trim());
        } else {
          setError(getLoginFailureMessage(response));
          setPasscode("");
        }
      }
    } catch (err: any) {
      console.error("Login failed:", err?.message ?? err);
      console.error("Login error data:", safeStringify(err?.data ?? err));

      if (isDeviceNotRegisteredError(err)) {
        showDeviceConflict(phoneToUse.trim());
      } else {
        setError(getLoginFailureMessage(err?.data ?? err));
        setPasscode("");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    console.info("Biometric login tapped", {
      biometricAvailable,
      nativeModuleAvailable: hasLocalAuthenticationNativeModule(),
      isLoading
    });
    if (!biometricAvailable || isLoading) {
      console.warn(
        "Biometric login skipped because the feature is unavailable or busy."
      );
      return;
    }

    try {
      if (!hasLocalAuthenticationNativeModule() || !localAuthentication) {
        setError(
          "Biometric login is not included in this app build. Install an updated app build to use it."
        );
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
      setError(
        "Biometric authentication could not be completed. Please try again."
      );
    }
  };

  const handleEnableBiometric = async () => {
    if (!biometricAvailable || !localAuthentication || isEnablingBiometric) {
      setError(
        biometricMessage || "Biometric login is unavailable on this device."
      );
      return;
    }

    setIsEnablingBiometric(true);
    setError(null);
    try {
      const savedPasscode = await authStorage.getPasscode();
      if (!savedPasscode) {
        setError("Log in with your passcode once before enabling biometrics.");
        return;
      }

      const result = await localAuthentication.authenticateAsync({
        promptMessage: `Enable ${biometricLabel} for Jaiz eToken`,
        cancelLabel: "Cancel",
        disableDeviceFallback: true
      });
      if (!result.success) {
        setError(getBiometricFailureMessage(result.error));
        return;
      }

      await authStorage.setBiometricEnabled(true);
      setBiometricEnabled(true);
      setError(null);
    } catch (enableError) {
      console.error("Could not enable biometric login:", enableError);
      setError("Could not enable biometric login. Please try again.");
    } finally {
      setIsEnablingBiometric(false);
    }
  };

  const handleDelete = () => {
    setError(null);
    setPasscode((prev) => prev.slice(0, -1));
  };

  const handleDeviceConflictYes = async () => {
    if (!deviceConflictPhoneNumber || isInitiatingDeviceChange) return;

    const phone = deviceConflictPhoneNumber;
    setIsInitiatingDeviceChange(true);
    setShowDeviceConflictModal(false);
    setError(null);

    try {
      const response = await registrationApi.revokeDevice({
        phoneNumber: phone
      });

      if (!response.success) {
        setError(response.message || "Could not revoke device. Please try again.");
        return;
      }

      await authStorage.clearTotpCredentials();
      await authStorage.clearAuthSession();

      const initiateResponse = await registrationApi.initiateDeviceChange(phone);

      if (!initiateResponse.success) {
        setError(initiateResponse.message || "Could not initiate device change. Please try again.");
        return;
      }

      if (onDeviceChangeFlow) {
        onDeviceChangeFlow(phone);
      } else {
        console.error("onDeviceChangeFlow callback is not defined");
      }
    } catch (err: any) {
      console.error("Device change error:", err);
      setError(err?.message || "Device change failed. Please try again.");
    } finally {
      setIsInitiatingDeviceChange(false);
    }
  };

  const handleDeviceConflictNo = () => {
    setShowDeviceConflictModal(false);
    // Ensure phone number is set for login when modal is dismissed
    if (deviceConflictPhoneNumber) {
      setPhoneNumber(deviceConflictPhoneNumber);
      setShowPhoneField(true);
    }
    setDeviceConflictPhoneNumber("");
    setError(null);
  };

  const keypadRows = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"]
  ];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["bottom"]}>
      <LinearGradient
        colors={["#04325C", "#064783", "#1F67B3"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{
          height: headerHeight,
          paddingTop: insets.top,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
          overflow: "hidden"
        }}
        className="items-center justify-center px-6"
      >
        <Image
          source={require("../../assets/images/bgpattern.jpeg")}
          resizeMode="cover"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
          }}
        />

        <View className="w-full max-w-[520px] items-center">
          {/* Avatar with translucent halo */}
          <View
            className="items-center justify-center rounded-full"
            style={{
              width: 92,
              height: 92,
              backgroundColor: "rgba(255,255,255,0.14)"
            }}
          >
            <View
              className="items-center justify-center rounded-full bg-white"
              style={{
                width: 76,
                height: 76,
                borderWidth: 3,
                borderColor: GOLD,
                shadowColor: "#021B33",
                shadowOpacity: 0.3,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: 6
              }}
            >
              <Text
                className="text-[30px] font-outfit-semibold"
                style={{ color: BLUE_INK }}
              >
                {initial}
              </Text>
            </View>
          </View>

          <Text
            className="mt-4 text-center text-[26px] font-outfit-bold text-white"
            style={{ letterSpacing: -0.3 }}
            numberOfLines={2}
          >
            Hello{customerName.trim() ? `, ${customerName.trim()}` : ""}
          </Text>
          <Text className="mt-1 text-center text-[15px] font-outfit text-[#C9DBF0]">
            Log in to access your eToken
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{
          flexGrow: 1,
          width: "100%",
          maxWidth: 560,
          alignSelf: "center",
          paddingTop: compact ? 18 : 26,
          paddingBottom: 24
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {showPhoneField && (
          <>
            <Text className="text-[14px] font-outfit-normal text-[#6B7280]">
              Phone number
            </Text>
            <View
              className="mt-2 flex-row items-start rounded-2xl border-2 px-4 py-3"
              style={{
                borderColor: "#D9E2EC",
                backgroundColor: "#F8F9FB"
              }}
            >
              <TextInput
                className="flex-1 text-[16px] font-outfit-medium text-[#102F62]"
                placeholder=""
                placeholderTextColor="#9CA3AF"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                maxLength={15}
                textAlign="left"
              />
            </View>
          </>
        )}

        <Text className="text-center text-[21px] font-outfit-semibold text-[#102F62]">
          {!showPhoneField && "Enter your passcode"}
        </Text>

        <PasscodeDots length={PASSCODE_LENGTH} filled={passcode.length} />

        {error && (
          <View
            accessibilityLiveRegion="polite"
            className="mb-1 mt-1 self-center rounded-xl px-4 py-2"
            style={{ backgroundColor: "#FDECEC", maxWidth: "100%" }}
          >
            <Text className="text-center text-[13px] font-outfit-medium text-[#C62828]">
              {error}
            </Text>
          </View>
        )}

        <View
          className="mt-2 px-3 py-2"
          style={{ backgroundColor: "#F2F5F9", borderRadius: 28 }}
        >
          {keypadRows.map((row, i) => (
            <View key={i} className="flex-row">
              {row.map((digit) => (
                <KeypadButton
                  key={digit}
                  label={digit}
                  onPress={() => handleDigitPress(digit)}
                  height={keypadRowHeight}
                />
              ))}
            </View>
          ))}
          <View className="flex-row">
            <View style={{ height: keypadRowHeight }} className="flex-1" />
            <KeypadButton
              label="0"
              onPress={() => handleDigitPress("0")}
              height={keypadRowHeight}
            />
            <KeypadButton
              onPress={handleDelete}
              icon={<Delete size={24} color={BLUE_INK} strokeWidth={1.9} />}
              height={keypadRowHeight}
            />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => onForgotPasscode(username)}
          hitSlop={8}
          className="mt-3 items-center py-2 active:opacity-70"
        >
          <Text className="text-[14px] font-outfit-semibold text-[#174A8E]">
            Forgot passcode?
          </Text>
        </Pressable>

        {biometricEnabled && !biometricAvailable && biometricMessage ? (
          <Text className="mt-2 text-center text-[12px] font-outfit text-[#7A8491]">
            {biometricMessage}
          </Text>
        ) : null}

        {biometricAvailable ? (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              void (biometricEnabled
                ? handleBiometricLogin()
                : handleEnableBiometric())
            }
            disabled={isLoading || isEnablingBiometric}
            className={`mt-4 h-14 flex-row items-center justify-center self-center rounded-full px-6 active:bg-[#E3EEFC] ${isEnablingBiometric ? "opacity-60" : ""}`}
            style={{
              width: Math.min(screenWidth - 48, 360),
              backgroundColor: "#EEF4FD",
              borderWidth: 1.5,
              borderColor: "#B9D0F5"
            }}
          >
            <Fingerprint size={25} color={BLUE_INK} strokeWidth={1.8} />
            <Text
              className="ml-3 text-[15px] font-outfit-semibold"
              style={{ color: BLUE_INK }}
            >
              {isEnablingBiometric
                ? "Enabling biometric login..."
                : biometricEnabled
                  ? `Log in with ${biometricLabel}`
                  : "Enable biometric login"}
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={onGetStarted}
          hitSlop={8}
          className="mt-5 items-center py-2 active:opacity-70"
        >
          <Text className="text-[14px] font-outfit text-[#6F7783]">
            Set up another account
          </Text>
        </Pressable>
      </ScrollView>

      <LoadingOverlay visible={isLoading || isInitiatingDeviceChange} />

      {/*
        Device conflict prompt.
        Rendered as an in-tree overlay instead of a native <Modal>. LoadingOverlay
        is hidden in the same tick the error arrives, and a native modal that tries
        to present while another is dismissing is silently dropped (notably on iOS).
      */}
      {showDeviceConflictModal && (
        <View
          accessibilityViewIsModal
          className="items-center justify-center bg-black/50 px-6"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            elevation: 20
          }}
        >
          <View
            className="w-full max-w-sm rounded-3xl bg-white p-6"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 24
            }}
          >
            <Text className="text-center text-[22px] font-outfit-semibold text-[#1B2D4A]">
              Device Conflict
            </Text>

            <Text className="mt-3 text-center text-[15px] font-outfit text-[#67787F] leading-[22px]">
              Your account is linked to another device. Do you want to change device?
            </Text>

            <View className="mt-6 flex-row gap-3">
              <Pressable
                accessibilityRole="button"
                onPress={handleDeviceConflictNo}
                className="flex-1 h-12 flex-row items-center justify-center rounded-2xl border border-[#DDE3EA] bg-white active:opacity-70"
              >
                <Text className="text-[17px] font-outfit-semibold text-[#1B2D4A]">
                  No
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={handleDeviceConflictYes}
                className="flex-1 h-12 flex-row items-center justify-center rounded-2xl bg-[#123E7C] active:opacity-85"
              >
                <Text className="text-[17px] font-outfit-semibold text-white">
                  Yes
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}