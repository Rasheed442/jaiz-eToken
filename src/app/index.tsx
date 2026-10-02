import { useEffect, useState, type ReactNode } from "react";
import { View } from "react-native";
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
import EtokenActivatedScreen from "@/screens/EtokenActivatedScreen";
import FacialVerificationScreen from "@/screens/FacialVerificationScreen";
import DashboardScreen from "@/screens/HomeScreen";
import LoginScreen from "@/screens/LoginScreen";
import OtpVerificationScreen from "@/screens/OtpVerificationScreen";
import PersonalRegistrationScreen from "@/screens/PersonalRegistrationScreen";
import RegisterDeviceScreen from "@/screens/RegisterDeviceScreen";
import SubmittedForReviewScreen from "@/screens/SubmittedForReviewScreen";
import VerificationDocumentScreen from "@/screens/VerificationDocumentScreen";
import WelcomeScreen from "@/screens/WelcomeScreen";

type Screen = "welcome" | "personal-registration" | "corporate-registration" | "verification-documents" | "submitted-for-review" | "otp" | "facial-verification" | "create-profile" | "etoken-activated" | "login" | "home" | "device-details" | "register-device" | "device-otp" | "device-registered" | "deregister-device" | "device-deregistered" | "animated-splash";
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

  const renderScreen = () => {
    if (screen === "animated-splash") {
      return (
        <View className="flex-1 bg-[#050505]">
          <AnimatedSplashScreen
            onComplete={() => {
              setTransitionDirection("forward");
              setScreen("welcome");
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
              setScreen("otp");
            }}
            onProfileCreated={({ username: profileUsername }) => {
              setUsername(profileUsername);
              setTransitionDirection("forward");
              setScreen("etoken-activated");
            }}
            originalPasscode=""
            progress={0.6}
          />
        </View>
      );
    }

    if (screen === "etoken-activated") {
      return (
        <View className="flex-1 bg-[#F3F5F7]">
          <EtokenActivatedScreen
            onGoToLogin={() => {
              setTransitionDirection("forward");
              setScreen("login");
            }}
          />
        </View>
      );
    }

    if (screen === "login") {
      return (
        <LoginScreen
          username={username}
          onUsernameChange={setUsername}
          onLogin={() => {
            setTransitionDirection("forward");
            setScreen("home");
          }}
          onForgotPasscode={() => {
            setTransitionDirection("backward");
            setScreen("welcome");
          }}
        />
      );
    }

    if (screen === "home") {
      return (
        <DashboardScreen
          fullName={username || "Ibrahim Al-Hassan"}
          cifLast4="4842"
          onManageDevice={() => {
            setTransitionDirection("forward");
            setScreen("device-details");
          }}
          onNotificationsPress={() => {}}
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
            onDeregister={() => {
              setTransitionDirection("forward");
              setScreen("device-deregistered");
            }}
            onCancel={() => {
              setTransitionDirection("backward");
              setScreen("device-details");
            }}
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
    <AnimatedScreen key={screen} direction={transitionDirection}>
      {renderScreen()}
    </AnimatedScreen>
  );
}
