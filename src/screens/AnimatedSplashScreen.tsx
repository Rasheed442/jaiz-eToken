import { useEffect, useRef } from "react";
import { Animated, Easing, Image, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AnimatedSplashScreenProps = {
  onComplete: () => void;
};

export default function AnimatedSplashScreen({
  onComplete
}: AnimatedSplashScreenProps) {
  const pulse = useRef(new Animated.Value(0)).current;
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    );

    pulseAnimation.start();
    const completionTimer = setTimeout(() => onCompleteRef.current(), 2200);

    return () => {
      pulseAnimation.stop();
      clearTimeout(completionTimer);
    };
  }, [pulse]);

  const logoScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1.12]
  });
  return (
    <SafeAreaView className="flex-1 items-center justify-center overflow-hidden bg-[#193F7F]">
      <View pointerEvents="none" className="absolute inset-0 bg-black/10" />
      <Animated.View style={{ transform: [{ scale: logoScale }] }}>
        <Image
          accessibilityLabel="Jaiz logo"
          resizeMode="contain"
          source={require("../../assets/images/jaizlogo.png")}
          className="h-[50px] w-[50px]"
        />
      </Animated.View>
    </SafeAreaView>
  );
}
