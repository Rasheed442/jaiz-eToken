import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AppState, View } from "react-native";
import * as Device from "expo-device";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";

import AnimatedSplashScreen from "@/screens/AnimatedSplashScreen";
import CorporateRegistrationScreen from "@/screens/CorporateRegistrationScreen";
import CreateProfileScreen from "@/screens/CreateProfileScreen";
import DeregisterDeviceScreen from "@/screens/DeregisterDeviceScreen";
import DeviceDeregisteredScreen from "@/screens/Devicederegisteredscreen";
import DeviceDetailsScreen from "@/screens/Devicedetails";
import DeviceRegisteredScreen from "@/screens/DeviceregisteredScreen";
import FacialVerificationScreen from "@/screens/FacialVerificationScreen";
import ForgotPasscodeScreen from "@/screens/ForgotPasscodeScreen";
import DashboardScreen from "@/screens/HomeScreen";
import EtokenActivatedScreen from "@/screens/EtokenActivatedScreen";
import LoginScreen from "@/screens/LoginScreen";
import OtpVerificationScreen from "@/screens/OtpVerificationScreen";
import PersonalRegistrationScreen from "@/screens/PersonalRegistrationScreen";
import RegisterDeviceScreen from "@/screens/RegisterDeviceScreen";
import SubmittedForReviewScreen from "@/screens/SubmittedForReviewScreen";
import VerificationDocumentScreen from "@/screens/VerificationDocumentScreen";
import WelcomeScreen from "@/screens/WelcomeScreen";
import { registrationApi } from "@/lib/api";
import { authStorage } from "../lib/auth/storage";

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;

type Screen =
  | "welcome"
  | "personal-registration"
  | "corporate-registration"
  | "verification-documents"
  | "submitted-for-review"
  | "otp"
  | "facial-verification"
  | "create-profile"
  | "etoken-activated"
  | "login"
  | "forgot-passcode"
  | "home"
  | "device-details"
  | "register-device"
  | "device-otp"
  | "device-registered"
  | "deregister-device"
  | "device-deregistered"
  | "animated-splash";
type TransitionDirection = "forward" | "backward";

function AnimatedScreen({
  direction,
  children
}: {
  direction: TransitionDirection;
  children: ReactNode;
}) {
  const translateX = useSharedValue(direction === "forward" ? 52 : -52);

  useEffect(() => {
    translateX.value = withTiming(0, {
      duration: 320,
      easing: Easing.out(Easing.cubic)
    });
  }, [direction, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }]
  }));

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

export default function HomeScreen() {
  const [screen, setScreen] = useState<Screen>("animated-splash");
  const [transitionDirection, setTransitionDirection] =
    useState<TransitionDirection>("forward");
  const [username, setUsername] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [registrationToken, setRegistrationToken] = useState<string>();
  const [accountNumber, setAccountNumber] = useState<string | undefined>();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [nextScreen, setNextScreen] = useState<Screen | null>(null);
  const [forgotPasscodeUsername, setForgotPasscodeUsername] = useState("");
  const [forgotPasscodeAccountNumber, setForgotPasscodeAccountNumber] =
    useState("");
  const [isDeregisteringDevice, setIsDeregisteringDevice] = useState(false);
  const [deregisterDeviceError, setDeregisterDeviceError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const lastActivityAt = useRef(Date.now());
  const backgroundedAt = useRef<number | null>(null);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTimingOut = useRef(false);

  const handleInactivityLogout = useCallback(async () => {
    if (isTimingOut.current) return;
    isTimingOut.current = true;

    try {
      const rememberedUsername = await authStorage.getUsername();
      if (rememberedUsername) {
        void registrationApi
          .logout({ username: rememberedUsername })
          .catch((error) => {
            console.error("Session timeout logout error:", error);
          });
      }
    } catch (error) {
      console.error("Session timeout logout error:", error);
    } finally {
      try {
        await authStorage.clearAuthSession();
      } catch (error) {
        console.error("Could not clear the timed-out session:", error);
      }
      setIsAuthenticated(false);
      setTransitionDirection("backward");
      setScreen("login");
      isTimingOut.current = false;
    }
  }, []);

  const armInactivityTimer = useCallback(
    (delay = INACTIVITY_TIMEOUT_MS) => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => {
        void handleInactivityLogout();
      }, delay);
    },
    [handleInactivityLogout]
  );

  const recordActivity = useCallback(() => {
    if (!isAuthenticated || isTimingOut.current) return;

    const inactiveFor = Date.now() - lastActivityAt.current;
    if (inactiveFor >= INACTIVITY_TIMEOUT_MS) {
      void handleInactivityLogout();
      return;
    }

    lastActivityAt.current = Date.now();
    if (backgroundedAt.current !== null) {
      backgroundedAt.current = null;
      void authStorage.clearSessionBackgroundedAt();
    }
    armInactivityTimer();
  }, [armInactivityTimer, handleInactivityLogout, isAuthenticated]);

  const handleGoToDashboard = useCallback(async () => {
    const authData = await authStorage.getAuthData();
    if (!authData) return;

    lastActivityAt.current = Date.now();
    backgroundedAt.current = null;
    await authStorage.clearSessionBackgroundedAt();
    setIsAuthenticated(true);
    setUsername(authData.username);
    setCustomerName(authData.customerName);
    setTransitionDirection("forward");
    setScreen("home");
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
      return;
    }

    const remaining =
      INACTIVITY_TIMEOUT_MS - (Date.now() - lastActivityAt.current);
    if (remaining <= 0) {
      void handleInactivityLogout();
      return;
    }
    armInactivityTimer(remaining);

    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "background") {
        const timestamp = Date.now();
        backgroundedAt.current = timestamp;
        lastActivityAt.current = timestamp;
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        inactivityTimer.current = null;
        void authStorage.setSessionBackgroundedAt(timestamp);
        return;
      }

      if (state !== "active") return;

      void (async () => {
        const timestamp =
          backgroundedAt.current ??
          (await authStorage.getSessionBackgroundedAt());
        backgroundedAt.current = null;
        await authStorage.clearSessionBackgroundedAt();
        if (timestamp !== null && lastActivityAt.current <= timestamp) {
          lastActivityAt.current = timestamp;
        }

        const remaining =
          INACTIVITY_TIMEOUT_MS - (Date.now() - lastActivityAt.current);
        if (remaining <= 0) void handleInactivityLogout();
        else armInactivityTimer(remaining);
      })();
    });

    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
      appStateSubscription.remove();
    };
  }, [armInactivityTimer, handleInactivityLogout, isAuthenticated]);

  // Check if user has already registered and determine where to go
  useEffect(() => {
    const checkAuthStatus = async () => {
      const rememberedUsername = await authStorage.getUsername();
      const rememberedCustomerName = await authStorage.getCustomerName();
      const rememberedAccountNumber = await authStorage.getAccountNumber();
      const authData = await authStorage.getAuthData();

      if (rememberedUsername) {
        setUsername(rememberedUsername);
      }
      if (rememberedCustomerName) {
        setCustomerName(rememberedCustomerName);
      }
      if (rememberedAccountNumber) {
        setForgotPasscodeAccountNumber(rememberedAccountNumber);
      }

      if (authData) {
        const activeUsername = authData.username || rememberedUsername;
        const backgroundTimestamp =
          await authStorage.getSessionBackgroundedAt();
        const gracePeriodExpired =
          backgroundTimestamp !== null &&
          Date.now() - backgroundTimestamp >= INACTIVITY_TIMEOUT_MS;

        if (gracePeriodExpired) {
          if (activeUsername) {
            void registrationApi
              .logout({ username: activeUsername })
              .catch((error) => {
                console.error("Session timeout logout error:", error);
              });
          }
          await authStorage.clearAuthSession();
          setIsAuthenticated(false);
          setUsername(activeUsername || rememberedUsername || "");
          setNextScreen("login");
        } else {
          lastActivityAt.current = backgroundTimestamp ?? Date.now();
          backgroundedAt.current = null;
          await authStorage.clearSessionBackgroundedAt();
          if (activeUsername) setUsername(activeUsername);
          setCustomerName(authData.customerName || rememberedCustomerName || "");
          setIsAuthenticated(true);
          setNextScreen("home");
        }
      }
      // If user has remembered username but no tokens, they need to login
      else if (rememberedUsername) {
        // setNextScreen("welcome");
        setNextScreen("login");
      }
      // Otherwise, show welcome screen (new user)
      else {
        setNextScreen("welcome");
      }
    };
    checkAuthStatus();
  }, []);

  const handleDeregisterDevice = async () => {
    if (isDeregisteringDevice) return;

    setIsDeregisteringDevice(true);
    setDeregisterDeviceError("");

    try {
      const activePhoneNumber = (await authStorage.getUsername()) || username;
      if (!activePhoneNumber) {
        throw new Error(
          "Unable to find the account phone number. Please log in again."
        );
      }

      const response = await registrationApi.revokeDevice({
        username: activePhoneNumber
      });

      if (!response.success) {
        setDeregisterDeviceError(
          response.message || "Could not deregister this device. Please try again."
        );
        return;
      }

      await authStorage.clearAuthSession();
      setIsAuthenticated(false);
      setTransitionDirection("forward");
      setScreen("device-deregistered");
    } catch (error: any) {
      setDeregisterDeviceError(
        error?.message || "Could not deregister this device. Please try again."
      );
    } finally {
      setIsDeregisteringDevice(false);
    }
  };

  const renderScreen = () => {
    if (screen === "animated-splash") {
      return (
        <View className="flex-1 bg-[#050505]">
          <AnimatedSplashScreen
            onComplete={() => {
              if (nextScreen) {
                setTransitionDirection("forward");
                setScreen(nextScreen);
              }
            }}
          />
        </View>
      );
    }

    if (screen === "personal-registration") {
      return (
        <View className="flex-1 bg-[#F3F5F7]">
          <PersonalRegistrationScreen
            onBack={() => {
              setTransitionDirection("backward");
              setScreen("welcome");
            }}
            onContinue={(values) => {
              console.log("Registration values:", values);
              setTransitionDirection("forward");
              setScreen("otp");
            }}
            onOtpComplete={(values) => {
              console.log("OTP complete with values:", values);
              setRegistrationToken(values.registrationToken);
              setAccountNumber(values.accountNumber);
              setPhoneNumber(values.phoneNumber);
              setTransitionDirection("forward");
              setScreen("facial-verification");
            }}
          />
        </View>
      );
    }

    if (screen === "corporate-registration") {
      return (
        <View className="flex-1 bg-[#F3F5F7]">
          <CorporateRegistrationScreen
            onBack={() => {
              setTransitionDirection("backward");
              setScreen("welcome");
            }}
            onContinue={() => {
              setTransitionDirection("forward");
              setScreen("otp");
            }}
            onOtpComplete={() => {
              setTransitionDirection("forward");
              setScreen("facial-verification");
            }}
            onDocumentsSubmit={() => {
              setTransitionDirection("forward");
              setScreen("verification-documents");
            }}
          />
        </View>
      );
    }

    if (screen === "verification-documents") {
      return (
        <View className="flex-1 bg-[#F7F7F7]">
          <VerificationDocumentScreen
            onBack={() => {
              setTransitionDirection("backward");
              setScreen("corporate-registration");
            }}
            onSubmit={() => {
              setTransitionDirection("forward");
              setScreen("submitted-for-review");
            }}
          />
        </View>
      );
    }

    if (screen === "submitted-for-review") {
      return (
        <View className="flex-1 bg-[#F7F7F7]">
          <SubmittedForReviewScreen
            submittedAt={new Date()}
            referenceId="JEB-20260821-0417"
            onBack={() => {
              setTransitionDirection("backward");
              setScreen("verification-documents");
            }}
            onRefreshStatus={() => {
              // TODO: Implement status refresh logic
            }}
            onDone={() => {
              setTransitionDirection("backward");
              setScreen("login");
            }}
          />
        </View>
      );
    }

    if (screen === "device-otp") {
      return (
        <View className="flex-1 bg-[#F3F5F7]">
          <OtpVerificationScreen
            onBack={() => {
              setTransitionDirection("backward");
              setScreen("register-device");
            }}
            onVerifyComplete={() => {
              setTransitionDirection("forward");
              setScreen("device-registered");
            }}
          />
        </View>
      );
    }

    if (screen === "device-registered") {
      return (
        <View className="flex-1 bg-[#F7F7F7]">
          <DeviceRegisteredScreen
            onContinue={() => {
              setTransitionDirection("forward");
              setScreen("home");
            }}
          />
        </View>
      );
    }

    if (screen === "facial-verification") {
      return (
        <View className="flex-1 bg-[#F3F5F7]">
          <FacialVerificationScreen
            onBack={() => {
              setTransitionDirection("backward");
              setScreen("otp");
            }}
            onVerificationComplete={() => {
              setTransitionDirection("forward");
              setScreen("create-profile");
            }}
            accountNumber={accountNumber}
            registrationToken={registrationToken}
            step={3}
            totalSteps={5}
          />
        </View>
      );
    }

    if (screen === "create-profile") {
      return (
        <View className="flex-1 bg-[#F3F5F7]">
          <CreateProfileScreen
            onBack={() => {
              setTransitionDirection("backward");
              setScreen("facial-verification");
            }}
            onProfileCreated={() => {
              lastActivityAt.current = Date.now();
              backgroundedAt.current = null;
              void authStorage.clearSessionBackgroundedAt();
              setIsAuthenticated(true);
              setTransitionDirection("forward");
              setScreen("etoken-activated");
            }}
            accountNumber={accountNumber || ""}
            phoneNumber={phoneNumber}
            progress={0.8}
          />
        </View>
      );
    }

    if (screen === "etoken-activated") {
      return (
        <EtokenActivatedScreen
          deviceLabel={Device.modelName || "This device"}
          onGoToDashboard={handleGoToDashboard}
        />
      );
    }

    if (screen === "login") {
      return (
        <LoginScreen
          username={username}
          customerName={customerName}
          onUsernameChange={setUsername}
          onCustomerNameChange={setCustomerName}
          onLogin={async () => {
            // Load stored auth data after successful login
            const authData = await authStorage.getAuthData();
            if (authData) {
              lastActivityAt.current = Date.now();
              backgroundedAt.current = null;
              await authStorage.clearSessionBackgroundedAt();
              setIsAuthenticated(true);
              setCustomerName(authData.customerName);
              setTransitionDirection("forward");
              setScreen("home");
            }
          }}
          onGetStarted={() => {
            setTransitionDirection("backward");
            setScreen("welcome");
          }}
          onForgotPasscode={(username: string) => {
            setForgotPasscodeUsername(username);
            setTransitionDirection("forward");
            setScreen("forgot-passcode");
          }}
          onOpenMetaMapPlayground={() => {
            setTransitionDirection("forward");
          }}
        />
      );
    }

    if (screen === "forgot-passcode") {
      return (
        <View className="flex-1 bg-[#F3F5F7]">
          <ForgotPasscodeScreen
            onBack={() => {
              setTransitionDirection("backward");
              setScreen("login");
            }}
            onComplete={() => {
              setTransitionDirection("backward");
              setScreen("login");
            }}
            username={forgotPasscodeUsername}
            accountNumber={forgotPasscodeAccountNumber}
          />
        </View>
      );
    }

    if (screen === "home") {
      return (
        <DashboardScreen
          fullName={customerName || username || "Ibrahim Al-Hassan"}
          onManageDevice={() => {
            setTransitionDirection("forward");
            setScreen("device-details");
          }}
          onNotificationsPress={() => {}}
          onLogout={async () => {
            // Clear auth session but keep username remembered
            await authStorage.clearAuthSession();
            setIsAuthenticated(false);
            setTransitionDirection("backward");
            setScreen("login");
          }}
        />
      );
    }

    if (screen === "device-details") {
      return (
        <View className="flex-1 bg-[#F3F5F7]">
          <DeviceDetailsScreen
            onBack={() => {
              setTransitionDirection("backward");
              setScreen("home");
            }}
            onRegisterNewDevice={() => {
              setTransitionDirection("forward");
              setScreen("register-device");
            }}
            onDeregisterDevice={() => {
              setDeregisterDeviceError("");
              setTransitionDirection("forward");
              setScreen("deregister-device");
            }}
          />
        </View>
      );
    }

    if (screen === "deregister-device") {
      return (
        <View className="flex-1 bg-[#F7F7F7]">
          <DeregisterDeviceScreen
            onDeregister={() => void handleDeregisterDevice()}
            onCancel={() => {
              setDeregisterDeviceError("");
              setTransitionDirection("backward");
              setScreen("device-details");
            }}
            isLoading={isDeregisteringDevice}
            errorMessage={deregisterDeviceError}
          />
        </View>
      );
    }

    if (screen === "device-deregistered") {
      return (
        <View className="flex-1 bg-[#F7F7F7]">
          <DeviceDeregisteredScreen
            onRegisterNewDevice={() => {
              setTransitionDirection("forward");
              setScreen("register-device");
            }}
            onDone={() => {
              setTransitionDirection("backward");
              setScreen("welcome");
            }}
          />
        </View>
      );
    }

    if (screen === "register-device") {
      return (
        <View className="flex-1 bg-[#F7F7F8]">
          <RegisterDeviceScreen
            onBack={() => {
              setTransitionDirection("backward");
              setScreen("device-details");
            }}
            onRegisterComplete={() => {
              setTransitionDirection("forward");
              setScreen("device-otp");
            }}
          />
        </View>
      );
    }

    return (
      <View className="flex-1">
        <WelcomeScreen
          onContinue={(accountType) => {
            if (accountType === "Personal") {
              setTransitionDirection("forward");
              setScreen("personal-registration");
            } else if (accountType === "Corporate") {
              setTransitionDirection("forward");
              setScreen("corporate-registration");
            }
          }}
          onLogin={() => {
            setTransitionDirection("forward");
            setScreen("login");
          }}
        />
      </View>
    );
  };

  return (
    <View
      className="flex-1"
      onTouchStart={recordActivity}
      onTouchMove={recordActivity}
    >
      <AnimatedScreen key={screen} direction={transitionDirection}>
        {renderScreen()}
      </AnimatedScreen>
    </View>
  );
}
