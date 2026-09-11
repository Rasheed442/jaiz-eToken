import { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const STRIPE_COUNT = 6;
const SKEW_ANGLE = "20deg";
// Extra width to account for skew gaps at edges
const EXTRA = width * 0.6;

type AnimatedSplashScreenProps = {
  onComplete: () => void;
};

export default function AnimatedSplashScreen({
  onComplete
}: AnimatedSplashScreenProps) {
  const animations = useRef(
    Array.from({ length: STRIPE_COUNT * 2 }, () => new Animated.Value(0))
  ).current;
  const [animationComplete, setAnimationComplete] = useState(false);
  const hasNavigated = useRef(false);

  useEffect(() => {
    Animated.stagger(
      50,
      animations.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 1000,
          delay: 300,
          useNativeDriver: true
        })
      )
    ).start(() => {
      setAnimationComplete(true);
    });
  }, [animations]);

  useEffect(() => {
    if (!animationComplete || hasNavigated.current) {
      return;
    }

    hasNavigated.current = true;
    const navigationTimer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => clearTimeout(navigationTimer);
  }, [animationComplete, onComplete]);

  const stripeWidth = (width + EXTRA) / STRIPE_COUNT;

  const topStripes = animations.slice(0, STRIPE_COUNT).map((anim, i) => (
    <Animated.View
      key={`top-${i}`}
      style={[
        styles.stripe,
        {
          // Start stripes from left edge with slight negative offset to fill gaps
          left: i * stripeWidth - EXTRA / 2,
          top: 0,
          width: stripeWidth + 8, // +8 to close any hairline gaps
          height: height * 0.55 + width * 0.4, // tall enough after skew
          transform: [
            { skewX: SKEW_ANGLE },
            {
              translateX: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -(width + EXTRA) * 1.2]
              })
            },
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -height]
              })
            }
          ]
        }
      ]}
    />
  ));

  const bottomStripes = animations.slice(STRIPE_COUNT).map((anim, i) => (
    <Animated.View
      key={`bot-${i}`}
      style={[
        styles.stripe,
        {
          // Mirror the top — start from right side going left
          right: i * stripeWidth - EXTRA / 2,
          bottom: 0,
          width: stripeWidth + 8,
          height: height * 0.55 + width * 0.4,
          transform: [
            { skewX: SKEW_ANGLE },
            {
              translateX: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, (width + EXTRA) * 1.2]
              })
            },
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, height]
              })
            }
          ]
        }
      ]}
    />
  ));

  return (
    <SafeAreaView style={styles.container}>
      {/* Top stripes — slide up-left */}
      <View style={styles.topPanel} pointerEvents="none">
        {topStripes}
      </View>

      {/* Bottom stripes — slide down-right */}
      <View style={styles.bottomPanel} pointerEvents="none">
        {bottomStripes}
      </View>

      {/* Logo */}
      <View
        style={styles.logoWrap}
        className="bg-neutral-900 border border-white/10 rounded-full p-4 flex items-center text-center justify-center"
      >
 

          <View className="flex-row items-center">
                    <View className="h-11 w-11 items-center justify-center rounded-xl border-2 border-[#F8C300] bg-white">
                      <Text className="text-lg font-bold text-[#193F7F]">J</Text>
                    </View>
                    <View className="ml-2">
                      <Text className="text-base font-bold tracking-wide text-white">
                        JAIZ
                      </Text>
                      <Text className="text-base font-semibold tracking-wide text-[#F8C300]">
                        eTOKEN
                      </Text>
                    </View>
                  </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8C300",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  topPanel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.55 + width * 0.4,
    overflow: "hidden",
    zIndex: 10
  },
  bottomPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.55 + width * 0.4,
    overflow: "hidden",
    zIndex: 10,
    transform: [{ scaleX: -1 }]
  },
  stripe: {
    position: "absolute",
    backgroundColor: "#132C58",
    borderTopRightRadius: 30,
    borderTopLeftRadius: 30
  },
  logoWrap: {
    zIndex: 20,
    alignItems: "center",
    justifyContent: "center"
  }
});