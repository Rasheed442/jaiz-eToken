import { CameraView, useCameraPermissions } from "expo-camera";
import { ChevronLeft } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

type FacialVerificationScreenProps = {
  onBack: () => void;
  onVerificationComplete: (photoUri?: string) => void;
  step?: number;
  totalSteps?: number;
};

function ProgressBar({ step, totalSteps }: { step: number; totalSteps: number }) {
  const progress = Math.min(1, Math.max(0, step / totalSteps));
  return (
    <View className="h-2.5 w-full overflow-hidden rounded-full bg-[#D6E4F5]">
      <View className="h-full rounded-full bg-[#123E7C]" style={{ width: `${progress * 100}%` }} />
    </View>
  );
}

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel="Go back"
      accessibilityRole="button"
      className="h-10 w-10 items-center justify-center rounded-xl bg-[#ecedee] active:opacity-70"
      onPress={onPress}
    >
      <ChevronLeft size={22} color="black" />
    </Pressable>
  );
}

export default function FacialVerificationScreen({
  onBack,
  onVerificationComplete,
  step = 3,
  totalSteps = 5
}: FacialVerificationScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanningProgress, setScanningProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const scanLineY = useSharedValue(0);

  useEffect(() => {
    if (isScanning) {
      scanLineY.value = withRepeat(
        withSequence(withTiming(1, { duration: 2000 }), withTiming(0, { duration: 2000 })),
        -1,
        false
      );

      const interval = setInterval(() => {
        setScanningProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsScanning(false);
            finishScan();
            return 100;
          }
          return prev + 2;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isScanning]);

  const scanLineStyle = useAnimatedStyle(() => ({
    top: `${scanLineY.value * 100}%`
  }));

  const finishScan = async () => {
    // Capture a still frame to send to your verification backend
    try {
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.7,
        base64: false
      });
      if (photo?.uri) setCapturedUri(photo.uri);
      setTimeout(() => onVerificationComplete(photo?.uri), 500);
    } catch (err) {
      console.warn("Failed to capture verification photo", err);
      setTimeout(() => onVerificationComplete(), 500);
    }
  };

  const handleStartVerification = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }
    setIsScanning(true);
  };

  const cameraDenied = permission && !permission.granted;

  return (
    <SafeAreaView className="flex-1 bg-[#F3F5F7]">
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-10">
        <View className="flex-row items-center pt-6">
          <BackButton onPress={onBack} />
          <View className="ml-3 flex-1">
            <ProgressBar step={step} totalSteps={totalSteps} />
          </View>
        </View>

        <Animated.View entering={FadeIn.duration(400)}>
          <Text className="mt-7 text-[26px] font-outfit-semibold text-[#1B2D4A]">
            Verify it's you
          </Text>
          <Text className="mt-2 text-[15px] font-outfit text-[#67787F]">
            Position your face within the frame and hold still.
          </Text>

          <View className="mt-8 items-center justify-center">
            <View className="relative h-[280px] w-[280px] items-center justify-center overflow-hidden rounded-3xl border-dashed border-4 border-[#00C853] bg-[#E8F5E9]">
              {permission?.granted ? (
                <CameraView
                  ref={cameraRef}
                  style={{ width: "100%", height: "100%", borderRadius: 20}}
                  facing="front"
                />
              ) : (
                <View className="items-center justify-center opacity-30">
                  <View className="h-20 w-20 rounded-full bg-[#1B2D4A]" />
                  <View className="mt-2 h-16 w-24 rounded-full bg-[#1B2D4A]" />
                </View>
              )}

              {isScanning && (
                <Animated.View
                  style={[
                    {
                      position: "absolute",
                      left: 0,
                      right: 0,
                      height: 2,
                      backgroundColor: "#00C853",
                      shadowColor: "#00C853",
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.8,
                      shadowRadius: 8
                    },
                    scanLineStyle
                  ]}
                />
              )}
            </View>

            {isScanning && (
              <View className="mt-6">
                <Text className="text-center text-[18px] font-outfit-semibold text-[#00C853]">
                  Scanning... {scanningProgress}%
                </Text>
              </View>
            )}

            {!isScanning && cameraDenied && (
              <View className="mt-6">
                <Text className="text-center text-[15px] font-outfit text-[#D32F2F]">
                  Camera access was denied. Enable it in your device settings to continue.
                </Text>
              </View>
            )}

            {!isScanning && !cameraDenied && (
              <View className="mt-6">
                <Text className="text-center text-[15px] font-outfit text-[#67787F]">
                  Make sure you're in a well-lit area and your full face is visible.
                </Text>
              </View>
            )}
          </View>

          <View className="mt-12">
            <Pressable
              accessibilityRole="button"
              className="flex-row items-center justify-center rounded-[28px] bg-[#123E7C] px-5 py-4 active:opacity-80"
              onPress={handleStartVerification}
              disabled={isScanning}
            >
              <Text className="text-[18px] font-outfit-semibold text-white">
                {isScanning ? "Scanning..." : "Start Verification"}
              </Text>
              {!isScanning && <Text className="ml-2 text-[22px] font-light text-white">›</Text>}
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}