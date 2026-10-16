import { ChevronLeft, ScanFace } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  NativeEventEmitter,
  NativeModules,
  Pressable,
  ScrollView,
  Text,
  View
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { registrationApi } from "../lib/api";
import type { StartLivelinessData } from "../lib/api/types";
import { METAMAP_CLIENT_ID } from "../lib/metamap";

type FacialVerificationScreenProps = {
  onBack: () => void;
  onVerificationComplete: () => void;
  accountNumber?: string;
  registrationToken?: string;
  step?: number;
  totalSteps?: number;
};

function ProgressBar({
  step,
  totalSteps
}: {
  step: number;
  totalSteps: number;
}) {
  const progress = Math.min(1, Math.max(0, step / totalSteps));
  return (
    <View className="h-2.5 w-full overflow-hidden rounded-full bg-[#D6E4F5]">
      <View
        className="h-full rounded-full bg-[#123E7C]"
        style={{ width: `${progress * 100}%` }}
      />
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

const CONFIRM_INTERVAL_MS = 5000;
const MAX_CONFIRM_ATTEMPTS = 60;
export default function FacialVerificationScreen({
  onBack,
  onVerificationComplete,
  accountNumber,
  registrationToken,
  step = 3,
  totalSteps = 5
}: FacialVerificationScreenProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isFlowOpen, setIsFlowOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false);
  const [liveliness, setLiveliness] = useState<StartLivelinessData | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isConfirmingRef = useRef(false);
  const isMountedRef = useRef(true);
  const completedRef = useRef(false);

  const prepareLiveliness = useCallback(async () => {
    if (!accountNumber || !registrationToken) {
      setErrorMessage(
        "Registration details are missing. Go back and try again."
      );
      return;
    }

    setIsPreparing(true);
    setErrorMessage(null);
    setLiveliness(null);
    try {
      const response = await registrationApi.startLiveliness({
        accountNumber,
        registrationToken
      });

      if (!response.success) {
        throw new Error(
          response.message || "Could not prepare liveliness verification."
        );
      }

      setLiveliness(response.data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not prepare MetaMap verification."
      );
    } finally {
      setIsPreparing(false);
    }
  }, [accountNumber, registrationToken]);

  useEffect(() => {
    void prepareLiveliness();
  }, [prepareLiveliness]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const confirmWithBackend = useCallback(async () => {
    if (isConfirmingRef.current || completedRef.current) return;
    if (!accountNumber || !registrationToken) {
      setErrorMessage(
        "Registration details are missing. Go back and try again."
      );
      return;
    }

    isConfirmingRef.current = true;
    setIsConfirming(true);
    setErrorMessage(null);

    try {
      for (let attempt = 1; attempt <= MAX_CONFIRM_ATTEMPTS; attempt += 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, CONFIRM_INTERVAL_MS)
        );
        if (!isMountedRef.current) return;

        try {
          const response = await registrationApi.confirmLiveliness({
            accountNumber,
            registrationToken
          });

          if (response.success) {
            completedRef.current = true;
            onVerificationComplete();
            return;
          }

          if (isMountedRef.current) {
            setErrorMessage(
              response.message || "Verification is still processing."
            );
          }
        } catch (error) {
          if (isMountedRef.current) {
            setErrorMessage(
              error instanceof Error
                ? error.message
                : "Verification is still processing."
            );
          }
        }
      }

      if (isMountedRef.current) {
        setErrorMessage(
          "Verification is taking longer than expected. Try checking again."
        );
      }
    } finally {
      isConfirmingRef.current = false;
      if (isMountedRef.current) setIsConfirming(false);
    }
  }, [accountNumber, onVerificationComplete, registrationToken]);

  const { MetaMapRNSdk } = NativeModules;

  useEffect(() => {
    // const metaMapModule = NativeModules.MetaMapRNSdk;
    if (!MetaMapRNSdk) return;

    const emitter = new NativeEventEmitter(MetaMapRNSdk);
    const startedSubscription = emitter.addListener(
      "verificationStarted",
      () => {
        console.info("[MetaMap] verificationStarted");
      }
    );
    const successSubscription = emitter.addListener(
      "verificationSuccess",
      () => {
        setIsFlowOpen(false);
        setIsAwaitingConfirmation(true);
        void confirmWithBackend();
      }
    );

    const canceledSubscription = emitter.addListener(
      "verificationCanceled",
      () => {
        setIsFlowOpen(false);
        setIsAwaitingConfirmation(false);
        setErrorMessage(
          "Verification was canceled. You can start it again when ready."
        );
      }
    );

    return () => {
      startedSubscription.remove();
      successSubscription.remove();
      canceledSubscription.remove();
    };
  }, [confirmWithBackend]);

  const handleStartVerification = async () => {
    if (isStarting || isPreparing || isFlowOpen || isConfirming) return;
    if (!accountNumber || !registrationToken) {
      setErrorMessage(
        "Registration details are missing. Go back and try again."
      );
      return;
    }

    // const metaMapModule = NativeModules.MetaMapRNSdk;
    if (!MetaMapRNSdk) {
      setErrorMessage(
        "MetaMap is unavailable in this app build. Create a new native development or preview build."
      );
      return;
    }

    if (!liveliness) {
      void prepareLiveliness();
      return;
    }

    setIsStarting(true);
    setErrorMessage(null);
    setIsAwaitingConfirmation(false);
    completedRef.current = false;

    try {
      const verificationData = liveliness;
      const clientId =
        verificationData.clientId ||
        verificationData.metadata?.clientId ||
        METAMAP_CLIENT_ID;
      const flowId =
        verificationData.flowId || verificationData.metadata?.flowId;
      const userPhotoLink =
        verificationData.userPhotoLink ||
        verificationData.metadata?.userPhotoLink;
      const userPhotoHash =
        verificationData.userPhotoHash ||
        verificationData.metadata?.userPhotoHash ||
        verificationData.metadata?.userPhotoLinkHash;
      const internalVerificationRef =
        verificationData.metadata?.internalVerificationRef ||
        verificationData.verificationReference;
      if (
        !clientId ||
        !flowId ||
        !userPhotoLink ||
        !userPhotoHash ||
        !internalVerificationRef
      ) {
        throw new Error(
          "The liveliness start response is missing MetaMap verification details."
        );
      }

      setLiveliness(verificationData);
      setIsFlowOpen(true);
      const metadata = {
        ...verificationData.metadata,
        internalVerificationRef,
        userPhotoLink,
        userPhotoLinkHash: userPhotoHash
      };

      console.log("🚀 ~ handleStartVerification ~ metadata:", clientId, flowId, metadata);
      MetaMapRNSdk.showFlow(clientId, flowId, metadata);
    } catch (error) {
      setIsFlowOpen(false);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not start MetaMap verification."
      );
    } finally {
      setIsStarting(false);
    }
  };

  const handleRetryConfirmation = () => {
    if (liveliness) void confirmWithBackend();
  };

  const busy = isPreparing || isStarting || isFlowOpen || isConfirming;

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
            Follow the secure MetaMap steps to verify your face against your BVN
            profile photo.
          </Text>

          <View className="mt-10 items-center">
            <View className="h-[240px] w-[240px] items-center justify-center rounded-full border-4 border-dashed border-[#123E7C] bg-[#E8F0FA]">
              <ScanFace size={112} color="#123E7C" strokeWidth={1.4} />
            </View>
            <Text className="mt-6 text-center text-[15px] font-outfit text-[#67787F]">
              Use a well-lit area and keep your face visible throughout the
              check.
            </Text>
          </View>

          {errorMessage && (
            <View className="mt-6 rounded-xl bg-[#FDECEC] px-4 py-3">
              <Text
                accessibilityRole="alert"
                className="text-center text-[14px] font-outfit text-[#B42318]"
              >
                {errorMessage}
              </Text>
            </View>
          )}

          <View className="mt-10">
            {liveliness &&
              isAwaitingConfirmation &&
              !isFlowOpen &&
              !isConfirming &&
              !completedRef.current ? (
              <Pressable
                accessibilityRole="button"
                className="items-center justify-center rounded-[28px] bg-[#123E7C] px-5 py-4 active:opacity-80"
                onPress={handleRetryConfirmation}
              >
                <Text className="text-[18px] font-outfit-semibold text-white">
                  Check verification again
                </Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                className={[
                  "flex-row items-center justify-center rounded-[28px] bg-[#123E7C] px-5 py-4 active:opacity-80",
                  busy ? "opacity-60" : ""
                ].join(" ")}
                onPress={handleStartVerification}
                disabled={busy}
              >
                <Text className="text-[18px] font-outfit-semibold text-white">
                  {isPreparing
                    ? "Preparing verification..."
                    : isStarting
                      ? "Starting verification..."
                      : isConfirming
                        ? "Confirming with Jaiz..."
                        : isFlowOpen
                          ? "Verification in progress..."
                          : !liveliness
                            ? "Retry preparation"
                            : "Start Verification"}
                </Text>
                {!busy && (
                  <Text className="ml-2 text-[22px] font-light text-white">
                    ›
                  </Text>
                )}
              </Pressable>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
