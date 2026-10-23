import { registrationApi } from "@/lib/api";
import { authStorage } from "@/lib/auth/storage";
import { createTotp } from "@/lib/auth/totp";
import * as Application from "expo-application";
import * as Clipboard from "expo-clipboard";
import * as Device from "expo-device";
import { LinearGradient } from "expo-linear-gradient";
import {
  AlertCircle,
  Copy,
  LogOut,
  RefreshCw,
  Smartphone
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  Text,
  View
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "../components/Toast";

type HomeScreenProps = {
  fullName: string;
  deviceName?: string;
  deviceLocation?: string;
  onManageDevice: () => void;
  onNotificationsPress: () => void;
  onLogout: () => void;
};

export default function HomeScreen({
  fullName,
  deviceName = Device.modelName || Device.deviceName || "This device",
  deviceLocation,
  onManageDevice,
  onNotificationsPress,
  onLogout
}: HomeScreenProps) {
  const [code, setCode] = useState("------");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"error" | "success" | "info">(
    "error"
  );
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [isVerifyingPasscode, setIsVerifyingPasscode] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const progress = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totpRef = useRef<ReturnType<typeof createTotp> | null>(null);

  useEffect(() => {
    let isMounted = true;

    authStorage.getAccountNumber().then((storedAccountNumber) => {
      if (isMounted && storedAccountNumber) {
        setAccountNumber(storedAccountNumber);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const initials = fullName
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const showToastMessage = useCallback(
    (message: string, type: "error" | "success" | "info" = "error") => {
      setToastMessage(message);
      setToastType(type);
      setShowToast(true);
    },
    []
  );

  const generateToken = useCallback(async () => {
    try {
      setIsGenerating(true);

      let totp = totpRef.current;
      if (!totp) {
        const credentials = await authStorage.getTotpCredentials();
        if (!credentials) {
          setCode("------");
          setTokenExpiresAt(null);
          setSecondsLeft(0);
          setShowPasscodeModal(true);
          return;
        }

        totp = createTotp(credentials);
        totpRef.current = totp;
      }

      const currentTime = Date.now();
      const tokenValue = totp.generate({ timestamp: currentTime });
      const remainingMs = totp.remaining({ timestamp: currentTime });
      if (remainingMs <= 0) {
        setCode("------");
        setTokenExpiresAt(null);
        setSecondsLeft(0);
        progress.value = 0;
        return;
      }

      const formattedToken = tokenValue.replace(/(\d{3})(\d{3})/, "$1 $2");
      const expiresAt = currentTime + remainingMs;
      setCode(formattedToken);
      setTokenExpiresAt(expiresAt);
      setSecondsLeft(Math.ceil(remainingMs / 1000));
    } catch {
      console.error("Unable to generate the local eToken.");
      setShowPasscodeModal(true);
      showToastMessage(
        "This device's eToken setup is invalid. Please set it up again.",
        "error"
      );
    } finally {
      setIsGenerating(false);
    }
  }, [showToastMessage]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (tokenExpiresAt === null) return;

    const remainingMs = Math.max(0, tokenExpiresAt - Date.now());
    setSecondsLeft(Math.ceil(remainingMs / 1000));
    progress.value = 1;
    progress.value = withTiming(0, {
      duration: remainingMs,
      easing: Easing.linear
    });

    const updateCountdown = () => {
      const secondsRemaining = Math.max(
        0,
        Math.ceil((tokenExpiresAt - Date.now()) / 1000)
      );
      setSecondsLeft(secondsRemaining);

      if (secondsRemaining === 0) {
        setCode("------");
        setTokenExpiresAt(null);
        progress.value = 0;
        timerRef.current = null;
        return;
      }

      const now = Date.now();
      const delayToNextSecond = 1000 - (now % 1000);
      timerRef.current = setTimeout(updateCountdown, delayToNextSecond);
    };

    const delayToNextSecond = 1000 - (Date.now() % 1000);
    timerRef.current = setTimeout(
      updateCountdown,
      Math.min(delayToNextSecond, remainingMs)
    );
  }, [tokenExpiresAt, progress]);

  useEffect(() => {
    if (tokenExpiresAt !== null) startTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [tokenExpiresAt, startTimer]);

  useEffect(() => {
    let isMounted = true;

    const initializeTotp = async () => {
      await authStorage.clearTokenState();
      if (!isMounted) return;
      const credentials = await authStorage.getTotpCredentials();
      if (!isMounted) return;

      if (credentials) {
        try {
          totpRef.current = createTotp(credentials);
          setCode("------");
          setTokenExpiresAt(null);
          setSecondsLeft(0);
        } catch {
          setShowPasscodeModal(true);
          showToastMessage(
            "This device's eToken setup is invalid. Please set it up again.",
            "error"
          );
        }
      } else {
        setShowPasscodeModal(true);
      }
    };

    void initializeTotp();
    return () => {
      isMounted = false;
    };
  }, [showToastMessage]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`
  }));

  const handleCopy = async () => {
    if (code === "------" || isGenerating) return;
    await Clipboard.setStringAsync(code.replace(/\s/g, ""));
    await authStorage.setDeviceLastUsedAt(new Date().toISOString());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleGenerateNew = async () => {
    await generateToken();
    await authStorage.setDeviceLastUsedAt(new Date().toISOString());
  };

  const handlePasscodeSubmit = async () => {
    if (passcodeInput.length !== 6) {
      showToastMessage("Passcode must be 6 digits", "error");
      return;
    }

    setIsVerifyingPasscode(true);

    try {
      const username = await authStorage.getUsername();
      let deviceId = await authStorage.getDeviceId();

      if (!deviceId) {
        if (Platform.OS === "android") {
          deviceId = Application.getAndroidId() || "";
        } else if (Platform.OS === "ios") {
          deviceId = (await Application.getIosIdForVendorAsync()) || "";
        }
      }

      if (!username || !deviceId) {
        throw new Error("Missing required data");
      }

      const deviceFingerprint = "sha256_" + deviceId;

      const payload = {
        phoneNumber: username,
        passcode: passcodeInput,
        deviceId,
        deviceFingerprint,
        useBiometric: false
      };

      const response = await registrationApi.login(payload);

      if (response.success && response.data) {
        const provisionResponse = await registrationApi.provisionToken(
          {
            username,
            passcode: passcodeInput,
            deviceId
          },
          response.data.accessToken
        );

        if (!provisionResponse.success || !provisionResponse.data?.secret) {
          showToastMessage(
            provisionResponse.message ||
              "Could not set up your eToken on this device.",
            "error"
          );
          return;
        }

        let provisionedTotp: ReturnType<typeof createTotp>;
        try {
          provisionedTotp = createTotp(provisionResponse.data);
          await authStorage.setTotpCredentials({
            secret: provisionResponse.data.secret,
            algorithm: provisionResponse.data.algorithm,
            digits: provisionResponse.data.digits,
            periodSeconds: provisionResponse.data.periodSeconds,
            issuedAt: provisionResponse.data.issuedAt
          });
        } catch {
          showToastMessage(
            "Could not securely save the eToken setup. Please try again.",
            "error"
          );
          return;
        }

        await authStorage.setAuthData({
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          username: response.data.username,
          customerName: response.data.customerName,
          accountNumber: response.data.accountNumber,
          passcode: passcodeInput,
          deviceId
        });

        await authStorage.setDeviceLastUsedAt(new Date().toISOString());
        totpRef.current = provisionedTotp;
        setShowPasscodeModal(false);
        setPasscodeInput("");
        setCode("------");
        setTokenExpiresAt(null);
        setSecondsLeft(0);
        progress.value = 0;
        showToastMessage(
          "eToken setup complete. Tap Generate OTP when you need a code.",
          "success"
        );
      } else {
        showToastMessage(response.message || "Invalid passcode", "error");
      }
    } catch (error: any) {
      console.error("Passcode verification error:", error);
      showToastMessage(error?.message || "Invalid passcode", "error");
    } finally {
      setIsVerifyingPasscode(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);

    try {
      await authStorage.clearAuthSession();
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
      onLogout();
    }
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeLabel = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <SafeAreaView className="flex-1 bg-[#F8F8F8]">
      <Toast
        visible={showToast}
        message={toastMessage}
        type={toastType}
        onHide={() => setShowToast(false)}
      />
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
                Personal · {accountNumber || "----"}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-2 items-center">
            {/* <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              onPress={onNotificationsPress}
              className="h-11 w-11 items-center justify-center rounded-full bg-white active:opacity-70"
            >
              <Bell size={20} color="#1B2D4A" />
            </Pressable> */}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Logout"
              onPress={handleLogout}
              className="h-11 w-11 items-center justify-center rounded-full bg-white active:opacity-70"
            >
              <LogOut size={20} color="#1B2D4A" />
            </Pressable>
          </View>
        </View>

        {/* OTP Card */}
        <View className="relative mt-6 overflow-hidden rounded-2xl bg-[#214788] px-5 pb-5 pt-5">
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

          {/* {isGenerating ? (
            <View className="mt-5 h-[52px] items-center justify-center">
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
          ) : ( */}
          <Text className="mt-5 pb-2 text-[42px] font-outfit-bold tracking-wider text-white">
            {code}
          </Text>
          {/* )} */}

          <Text className="mt-3 text-[14px] font-outfit text-white">
            {tokenExpiresAt === null
              ? "Tap Generate OTP when you need a code"
              : "Your one-time verification code"}
          </Text>

          <View className="mt-8 h-1.5 w-full overflow-hidden rounded-full bg-white/25">
            <Animated.View
              style={progressStyle}
              className="h-full rounded-full bg-[#F5B400]"
            />
          </View>

          <Text className="py-4 text-[13px] font-outfit text-white">
            {tokenExpiresAt === null ? "Code not generated" : `Expires in ${timeLabel}`}
          </Text>
        </View>

        {/* Actions */}
        <View className="mt-4 flex-row gap-3">
          <Pressable
            accessibilityRole="button"
            onPress={handleCopy}
            disabled={code === "------" || isGenerating}
            className={`flex-1 items-center rounded-2xl bg-white px-4 py-4 active:opacity-70 ${
              code === "------" || isGenerating ? "opacity-50" : ""
            }`}
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
            disabled={isGenerating || isVerifyingPasscode}
            className={`flex-1 items-center rounded-2xl bg-white px-4 py-4 active:opacity-70 ${
              isGenerating || isVerifyingPasscode ? "opacity-50" : ""
            }`}
          >
            <View className="h-9 w-9 items-center justify-center rounded-full bg-[#EAF0FB]">
              {isGenerating ? (
                <ActivityIndicator size="small" color="#123E7C" />
              ) : (
                <RefreshCw size={18} color="#123E7C" />
              )}
            </View>
            <Text className="mt-2 text-[14px] font-outfit-medium text-[#1B2D4A]">
              Generate OTP
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
        <View className="mt-auto flex-row items-center justify-center border-y border-gray-100 py-3">
          <Image
            source={require("../../assets/images/footerjlogo.png")}
            accessibilityLabel="Jaiz eToken"
            resizeMode="contain"
            style={{ width: 140, height: 32 }}
          />
        </View>
      </View>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => !isLoggingOut && setShowLogoutModal(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/50 px-6">
          <View
            className="w-full max-w-sm rounded-3xl bg-white p-6"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8
            }}
          >
            <View className="h-16 w-16 items-center justify-center self-center rounded-full bg-[#FDECEC]">
              <AlertCircle size={32} color="#B3261E" />
            </View>

            <Text className="mt-5 text-center text-[22px] font-outfit-semibold text-[#1B2D4A]">
              Logout
            </Text>

            <Text className="mt-3 text-center text-[15px] font-outfit text-[#67787F] leading-[22px]">
              Are you sure you want to logout? You'll need to enter your
              passcode to access your eToken again.
            </Text>

            <View className="mt-6 flex-row gap-3">
              <Pressable
                accessibilityRole="button"
                onPress={() => !isLoggingOut && setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className="flex-1 h-12 flex-row items-center justify-center rounded-2xl border border-[#DDE3EA] bg-white active:opacity-70"
              >
                <Text className="text-[17px] font-outfit-semibold text-[#1B2D4A]">
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={confirmLogout}
                disabled={isLoggingOut}
                className={`flex-1 h-12 flex-row items-center justify-center rounded-2xl bg-[#B3261E] active:opacity-85 ${
                  isLoggingOut ? "opacity-70" : ""
                }`}
              >
                {isLoggingOut ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-[17px] font-outfit-semibold text-white">
                    Logout
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Passcode Verification Modal */}
      <Modal
        visible={showPasscodeModal}
        transparent
        animationType="fade"
        onRequestClose={() =>
          !isVerifyingPasscode && setShowPasscodeModal(false)
        }
      >
        <View className="flex-1 items-center justify-center bg-black/50 px-6">
          <View
            className="w-full max-w-sm rounded-3xl bg-white p-6"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8
            }}
          >
            <View className="h-16 w-16 items-center justify-center self-center rounded-full bg-[#EAF0FB]">
              <Smartphone size={32} color="#123E7C" />
            </View>

            <Text className="mt-5 text-center text-[22px] font-outfit-semibold text-[#1B2D4A]">
              Set Up This Device’s eToken
            </Text>

            <Text className="mt-3 text-center text-[15px] font-outfit text-[#67787F] leading-[22px]">
              Enter your 6-digit passcode to securely provision a TOTP secret
              for this device.
            </Text>

            <View className="mt-6">
              <View className="h-14 flex-row items-center justify-center gap-3">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <View
                    key={index}
                    className={`h-12 w-10 items-center justify-center rounded-lg border-2 ${
                      passcodeInput[index]
                        ? "border-[#123E7C] bg-[#EAF0FB]"
                        : "border-[#DDE3EA]"
                    }`}
                  >
                    <Text className="text-[20px] font-outfit-semibold text-[#1B2D4A]">
                      {passcodeInput[index] ? "•" : ""}
                    </Text>
                  </View>
                ))}
              </View>

              <View className="mt-6 flex-row gap-3">
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    !isVerifyingPasscode && setShowPasscodeModal(false)
                  }
                  disabled={isVerifyingPasscode}
                  className="flex-1 h-12 flex-row items-center justify-center rounded-2xl border border-[#DDE3EA] bg-white active:opacity-70"
                >
                  <Text className="text-[17px] font-outfit-semibold text-[#1B2D4A]">
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={handlePasscodeSubmit}
                  disabled={isVerifyingPasscode || passcodeInput.length !== 6}
                  className={`flex-1 h-12 flex-row items-center justify-center rounded-2xl bg-[#123E7C] active:opacity-85 ${
                    isVerifyingPasscode || passcodeInput.length !== 6
                      ? "opacity-70"
                      : ""
                  }`}
                >
                  {isVerifyingPasscode ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-[17px] font-outfit-semibold text-white">
                      Set Up Token
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>

            {/* Numeric Keypad */}
            <View className="mt-4">
              {[
                ["1", "2", "3"],
                ["4", "5", "6"],
                ["7", "8", "9"]
              ].map((row, rowIndex) => (
                <View key={rowIndex} className="flex-row justify-center gap-4">
                  {row.map((num) => (
                    <Pressable
                      key={num}
                      onPress={() => {
                        if (passcodeInput.length < 6) {
                          setPasscodeInput((prev) => prev + num);
                        }
                      }}
                      className="h-14 w-20 items-center justify-center rounded-2xl bg-[#F8F8F8] active:bg-[#EAF0FB]"
                    >
                      <Text className="text-[24px] font-outfit-semibold text-[#1B2D4A]">
                        {num}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ))}
              <View className="mt-4 flex-row justify-center gap-4">
                <Pressable
                  onPress={() => {
                    setShowPasscodeModal(false);
                    setPasscodeInput("");
                  }}
                  className="h-14 w-20 items-center justify-center rounded-2xl bg-[#F8F8F8] active:bg-[#EAF0FB]"
                >
                  <Text className="text-[17px] font-outfit-semibold text-[#67787F]">
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    if (passcodeInput.length < 6) {
                      setPasscodeInput((prev) => prev + "0");
                    }
                  }}
                  className="h-14 w-20 items-center justify-center rounded-2xl bg-[#F8F8F8] active:bg-[#EAF0FB]"
                >
                  <Text className="text-[24px] font-outfit-semibold text-[#1B2D4A]">
                    0
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setPasscodeInput((prev) => prev.slice(0, -1));
                  }}
                  className="h-14 w-20 items-center justify-center rounded-2xl bg-[#F8F8F8] active:bg-[#EAF0FB]"
                >
                  <Text className="text-[17px] font-outfit-semibold text-[#67787F]">
                    ⌫
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
