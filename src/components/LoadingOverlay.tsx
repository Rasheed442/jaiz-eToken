import { useEffect, useRef } from "react";
import { Animated, Easing, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type LoadingOverlayProps = {
  visible: boolean;
};

export default function LoadingOverlay({ visible }: LoadingOverlayProps) {
  const logoScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) {
      logoScale.stopAnimation();
      logoScale.setValue(1);
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.14,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [logoScale, visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => {}}
    >
      <SafeAreaView
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: "rgba(25, 63, 127, 0.88)" }}
        edges={["top", "bottom"]}
      >
        <Animated.Image
          accessibilityLabel="Jaiz logo"
          source={require("../../assets/images/jaizlogo.png")}
          resizeMode="contain"
          style={{ width: 56, height: 56, transform: [{ scale: logoScale }] }}
        />
      </SafeAreaView>
    </Modal>
  );
}
