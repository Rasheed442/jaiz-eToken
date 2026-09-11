import { useEffect, useState, type ReactNode } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";

import AnimatedSplashScreen from "@/screens/AnimatedSplashScreen";
import OtpVerificationScreen from "@/screens/OtpVerificationScreen";
import PersonalRegistrationScreen from "@/screens/PersonalRegistrationScreen";
import WelcomeScreen from "@/screens/WelcomeScreen";

type Screen = "welcome" | "personal-registration" | "otp" | "animated-splash";
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
          />
        </View>
      );
    }

    if (screen === "otp") {
      return (
        <View className="flex-1 bg-[#0B1F3B]">
          <OtpVerificationScreen
            onBack={() => {
              setTransitionDirection("backward");
              setScreen("personal-registration");
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
