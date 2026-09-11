import { useEffect, useState, type ReactNode } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";

import AnimatedSplashScreen from "@/screens/AnimatedSplashScreen";
import CreateProfileScreen from "@/screens/CreateProfileScreen";
import EtokenActivatedScreen from "@/screens/EtokenActivatedScreen";
import FacialVerificationScreen from "@/screens/FacialVerificationScreen";
import LoginScreen from "@/screens/LoginScreen";
import PersonalRegistrationScreen from "@/screens/PersonalRegistrationScreen";
import WelcomeScreen from "@/screens/WelcomeScreen";

type Screen = "welcome" | "personal-registration" | "otp" | "facial-verification" | "create-profile" | "etoken-activated" | "login" | "animated-splash";
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
        <View className="flex-1 bg-[#0B1F3B]">
          <PersonalRegistrationScreen
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
          />
        </View>
      );
    }

    // if (screen === "otp") {
    //   return (
    //     <View className="flex-1 bg-[#0B1F3B]">
    //       <OtpVerificationScreen
    //         onBack={() => {
    //           setTransitionDirection("backward");
    //           setScreen("personal-registration");
    //         }}
    //         onVerifyComplete={() => {
    //           setTransitionDirection("forward");
    //           setScreen("facial-verification");
    //         }}
    //       />
    //     </View>
    //   );
    // }

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
            setScreen("welcome");
          }}
          onForgotPasscode={() => {
            setTransitionDirection("backward");
            setScreen("welcome");
          }}
        />
      );
    }

    return (
      <View className="flex-1">
        <WelcomeScreen
          onContinue={(accountType) => {
            if (accountType === "Personal") {
              setTransitionDirection("forward");
              setScreen("personal-registration");
            }
          }}
          onLogin={() => {
            setTransitionDirection("backward");
            setScreen("welcome");
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
