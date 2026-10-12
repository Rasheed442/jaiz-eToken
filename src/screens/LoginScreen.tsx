import * as Application from "expo-application";
import { LinearGradient } from "expo-linear-gradient";
import { Delete } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Easing,
    Modal,
    Platform,
    Pressable,
    Text,
    TextInput,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { registrationApi } from "../lib/api";
import { authStorage } from "../lib/auth/storage";

type LoginScreenProps = {
  username: string;
  onUsernameChange?: (value: string) => void;
  onLogin: () => void;
  onForgotPasscode: (username: string) => void;
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

/* ---------- Full-screen loading overlay ---------- */

function LoadingOverlay({ visible, message }: { visible: boolean; message: string }) {
  const enter = useRef(new Animated.Value(0)).current;
  const dots = useMemo(() => [0, 1, 2].map(() => new Animated.Value(0)), []);

  useEffect(() => {
    if (!visible) {
      enter.setValue(0);
      return;
    }
    Animated.timing(enter, {
      toValue: 1,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start();
  }, [visible, enter]);

  useEffect(() => {
    if (!visible) return;
    const loops = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 350, useNativeDriver: true }),
          Animated.delay((2 - i) * 160)
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => {
      loops.forEach((l) => l.stop());
      dots.forEach((d) => d.setValue(0));
    };
  }, [visible, dots]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <SafeAreaView className="flex-1 bg-[#F8C300]">
        <View className="flex-1 items-center justify-center px-8">
          <Animated.View
            style={{
              opacity: enter,
              transform: [
                { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }
              ],
              shadowColor: "#193F7F",
              shadowOpacity: 0.18,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
              elevation: 8
            }}
            className="h-24 w-24 items-center justify-center rounded-3xl bg-white"
          >
            <Text className="text-[40px] font-outfit-bold text-[#193F7F]">J</Text>
          </Animated.View>

          <Animated.View
            style={{
              opacity: enter,
              transform: [
                { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }
              ]
            }}
            className="mt-6 items-center"
          >
            <Text className="text-center text-[30px] tracking-wide text-[#193F7F]">
              <Text className="font-outfit-bold">JAIZ</Text>
              <Text className="font-outfit-medium"> eToken</Text>
            </Text>
          </Animated.View>

          <Animated.View style={{ opacity: enter }} className="mt-10 items-center">
            <View className="flex-row items-center gap-2">
              {dots.map((dot, i) => (
                <Animated.View
                  key={i}
                  style={{
                    opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
                    transform: [
                      { scale: dot.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.15] }) }
                    ]
                  }}
                  className="h-2.5 w-2.5 rounded-full bg-[#193F7F]"
                />
              ))}
            </View>
            <Text className="mt-4 text-[16px] font-outfit-medium text-[#193F7F]">{message}</Text>
          </Animated.View>
        </View>

        <Animated.View style={{ opacity: enter }} className="items-center px-8 pb-6">
          <Text className="text-[13px] font-outfit text-[#193F7F]/70">Securing your session</Text>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
}

/* ---------- Screen ---------- */

export default function LoginScreen({
  username,
  onUsernameChange,
  onLogin,
  onForgotPasscode
}: LoginScreenProps) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(false);

  const initial = username?.trim().charAt(0).toUpperCase() || "?";

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

  const handleLogin = async (passcodeToSubmit: string) => {
    if (isLoading) return;

    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    setIsLoading(true);
    setShowLoader(true);
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
        username: username.trim(),
        passcode: passcodeToSubmit,
        deviceId,
        deviceFingerprint,
        useBiometric: false
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
          deviceId,
        });

        // Remember username
        if (onUsernameChange) {
          onUsernameChange(response.data.username);
        }

        // Call onLogin callback to navigate to dashboard
        onLogin();
      } else {
        setShowLoader(false);
        setError(response.message || "Login failed");
        setPasscode("");
      }
    } catch (err: any) {
      console.error("Login failed:", err?.message ?? err);
      setShowLoader(false);
      setError(err?.message || "Login failed. Please try again.");
      setPasscode("");
    } finally {
      setIsLoading(false);
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

        {isLoading && (
          <View className="mt-3 items-center">
            <ActivityIndicator size="small" color="#123E7C" />
          </View>
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
      </View>

      {/* Full-screen loading overlay */}
      <LoadingOverlay visible={showLoader} message="Logging in..." />
    </SafeAreaView>
  );
}