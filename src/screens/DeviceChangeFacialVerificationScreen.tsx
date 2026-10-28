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

type DeviceChangeFacialVerificationScreenProps = {
  onBack: () => void;
  onVerificationComplete: () => void;
  phoneNumber: string;
  changeToken: string;
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
const PENDING_LIVELINESS_STATUSES = new Set([
  "PENDING",
  "PROCESSING",
  "IN_PROGRESS",
  "INITIATED",
  "SUBMITTED",
  "UNDER_REVIEW"
]);

function getErrorCode(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;

  const error = value as Record<string, unknown>;
  if (typeof error.errorCode === "string") return error.errorCode;
  return getErrorCode(error.data);
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
}

export default function DeviceChangeFacialVerificationScreen({
  onBack,
  onVerificationComplete,
  phoneNumber,
  changeToken,
  step = 4,
  totalSteps = 6
}: DeviceChangeFacialVerificationScreenProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isFlowOpen, setIsFlowOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false);
  const [liveliness, setLiveliness] = useState<StartLivelinessData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);
  const isConfirmingRef = useRef(false);
  const isMountedRef = useRef(true);
  const completedRef = useRef(false);
  const { MetaMapRNSdk } = NativeModules;

  // Mark mounted on every mount. Setting it only in the cleanup leaves it
  // false forever under React StrictMode's dev double-invoke.
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const prepareLiveliness = useCallback(async (): Promise<StartLivelinessData | null> => {
    if (!phoneNumber || !changeToken) {
      setErrorMessage("Missing required information to start face verification.");
      return null;
    }

    setIsPreparing(true);
    setErrorMessage(null);
    setLiveliness(null);

    try {
      const response = await registrationApi.startDeviceChangeLiveliness({
        username: phoneNumber,
        changeToken
      });

      if (!response.success || !response.data) {
        throw new Error(
          response.message || "Failed to start face verification."
        );
      }

      setLiveliness(response.data);
      return response.data;
    } catch (error) {
      if (isMountedRef.current) {
        setErrorMessage(
          getErrorMessage(error, "Failed to start face verification.")
        );
      }
      return null;
    } finally {
      if (isMountedRef.current) setIsPreparing(false);
    }
  }, [phoneNumber, changeToken]);

  // Prepare the session as soon as the screen opens, like the registration screen
  useEffect(() => {
    void prepareLiveliness();
  }, [prepareLiveliness]);

  /**
   * Opens the MetaMap SDK. showFlow is fire-and-forget: it returns immediately
   * and the result arrives through the native events registered below.
   * Arguments: (clientId, flowId, metadata).
   */
  const launchVerificationFlow = useCallback(
    (verificationData: StartLivelinessData) => {
      if (!MetaMapRNSdk) {
        throw new Error(
          "MetaMap is unavailable in this app build. Create a new native development or preview build."
        );
      }

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
      setConfirmationMessage(null);

      const metadata = {
        ...verificationData.metadata,
        internalVerificationRef,
        userPhotoLink,
        userPhotoLinkHash: userPhotoHash
      };

      console.log("[MetaMap] launch", {
  clientId,
  flowId,
  hasPhotoLink: Boolean(userPhotoLink),
  hasPhotoHash: Boolean(userPhotoHash),
  hasInternalRef: Boolean(internalVerificationRef),
  metadataKeys: Object.keys(metadata)
});

      MetaMapRNSdk.showFlow(clientId, flowId, metadata);
    },
    [MetaMapRNSdk]
  );

  const restartLiveliness = useCallback(async () => {
    setIsAwaitingConfirmation(false);
    setConfirmationMessage("Restarting verification...");

    const verificationData = await prepareLiveliness();
    if (!verificationData || !isMountedRef.current) return;

    setIsStarting(true);
    setErrorMessage(null);
    completedRef.current = false;
    try {
      launchVerificationFlow(verificationData);
    } catch (error) {
      setIsFlowOpen(false);
      setConfirmationMessage(null);
      setErrorMessage(
        getErrorMessage(error, "Could not restart MetaMap verification.")
      );
    } finally {
      if (isMountedRef.current) setIsStarting(false);
    }
  }, [launchVerificationFlow, prepareLiveliness]);

  const confirmWithBackend = useCallback(async () => {
    if (isConfirmingRef.current || completedRef.current) return;
    if (!phoneNumber || !changeToken) {
      setErrorMessage("Missing required information to confirm face verification.");
      return;
    }

    isConfirmingRef.current = true;
    setIsConfirming(true);
    setErrorMessage(null);
    setConfirmationMessage("Waiting for verification results...");

    try {
      for (let attempt = 1; attempt <= MAX_CONFIRM_ATTEMPTS; attempt += 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, CONFIRM_INTERVAL_MS)
        );
        if (!isMountedRef.current) return;

        try {
          const response = await registrationApi.confirmDeviceChangeLiveliness({
            username: phoneNumber,
            changeToken
          });

          if (!response.success) {
            const code =
              (response as { errorCode?: string }).errorCode ??
              getErrorCode(response);
            if (code === "LIVELINESS_NOT_STARTED") {
              if (isMountedRef.current) await restartLiveliness();
              return;
            }

            if (isMountedRef.current) {
              setErrorMessage(
                response.message || "Failed to confirm face verification."
              );
              setConfirmationMessage(null);
            }
            return;
          }

          const status = String(response.data?.status ?? "")
            .trim()
            .toUpperCase();

          if (status === "PASSED") {
            if (isMountedRef.current) setConfirmationMessage(null);
            completedRef.current = true;
            onVerificationComplete();
            return;
          }

          if (PENDING_LIVELINESS_STATUSES.has(status)) {
            if (isMountedRef.current) {
              setConfirmationMessage(
                response.message ||
                  "Your verification is still being processed. Checking again shortly."
              );
            }
            continue;
          }

          // Any other status is a definitive failure: stop polling
          if (isMountedRef.current) {
            setConfirmationMessage(null);
            setErrorMessage("Face verification failed. Please try again.");
          }
          return;
        } catch (error) {
          if (getErrorCode(error) === "LIVELINESS_NOT_STARTED") {
            if (isMountedRef.current) await restartLiveliness();
            return;
          }

          if (isMountedRef.current) {
            setErrorMessage(
              getErrorMessage(error, "Verification is still processing.")
            );
          }
        }
      }

      if (isMountedRef.current) {
        setConfirmationMessage(null);
        setErrorMessage(
          "Verification is taking longer than expected. Try checking again."
        );
      }
    } finally {
      isConfirmingRef.current = false;
      if (isMountedRef.current) setIsConfirming(false);
    }
  }, [changeToken, onVerificationComplete, phoneNumber, restartLiveliness]);

  // MetaMap reports its result through these native events
  useEffect(() => {
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
  }, [MetaMapRNSdk, confirmWithBackend]);

  const handleStartVerification = async () => {
    if (isStarting || isPreparing || isFlowOpen || isConfirming) return;

    if (!MetaMapRNSdk) {
      setErrorMessage(
        "MetaMap is unavailable in this app build. Create a new native development or preview build."
      );
      return;
    }

    setIsStarting(true);
    setErrorMessage(null);
    setConfirmationMessage(null);
    setIsAwaitingConfirmation(false);
    completedRef.current = false;

    try {
      // Use the data we have, or fetch it now. Never read `liveliness` state
      // right after setting it: it is stale until the next render.
      const verificationData = liveliness ?? (await prepareLiveliness());
      if (!verificationData || !isMountedRef.current) return;

      launchVerificationFlow(verificationData);
    } catch (error) {
      setIsFlowOpen(false);
      setErrorMessage(
        getErrorMessage(error, "Could not start MetaMap verification.")
      );
    } finally {
      if (isMountedRef.current) setIsStarting(false);
    }
  };

  const handleRetryConfirmation = () => {
    void confirmWithBackend();
  };

  const busy = isPreparing || isStarting || isFlowOpen || isConfirming;

  return (
    <SafeAreaView className="flex-1 bg-[#F3F5F7]">
      <View className="px-6 pt-14">
        <View className="flex-row items-center pt-6">
          <BackButton onPress={onBack} />
          <View className="ml-3 flex-1">
            <ProgressBar step={step} totalSteps={totalSteps} />
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-10 pt-7"
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeIn.duration(400)}>
          <View className="h-12 w-12 items-center justify-center rounded-xl bg-[#E6EDF7]">
            <ScanFace size={24} color="#123E7C" />
          </View>
          <Text className="mt-5 text-[26px] font-outfit-semibold text-[#1B2D4A]">
            Face verification
          </Text>
          <Text className="mt-2 text-[15px] font-outfit text-[#67787F]">
            We need to verify your face to complete the device change for your security.
          </Text>

          {errorMessage && (
            <View className="mt-5 rounded-xl border border-[#F0B4B4] bg-[#FDECEC] px-4 py-3">
              <Text
                accessibilityRole="alert"
                className="text-[13px] font-outfit-medium text-[#B3261E]"
              >
                {errorMessage}
              </Text>
            </View>
          )}

          {confirmationMessage && !errorMessage && (
            <View className="mt-5 rounded-xl border border-[#D4DFFD] bg-[#EEF2F6] px-4 py-3">
              <Text className="text-[13px] font-outfit-medium text-[#193F7F]">
                {confirmationMessage}
              </Text>
            </View>
          )}

          <View className="mt-8">
            {liveliness &&
            isAwaitingConfirmation &&
            !isFlowOpen &&
            !isConfirming &&
            !completedRef.current ? (
              <Pressable
                accessibilityRole="button"
                onPress={handleRetryConfirmation}
                className="h-14 flex-row items-center justify-center rounded-2xl bg-[#123E7C] active:opacity-85"
              >
                <Text className="text-[17px] font-outfit-semibold text-white">
                  Check verification again
                </Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={handleStartVerification}
                disabled={busy}
                className={[
                  "h-14 flex-row items-center justify-center rounded-2xl bg-[#123E7C] active:opacity-85",
                  busy ? "opacity-60" : ""
                ].join(" ")}
              >
                <Text className="text-[17px] font-outfit-semibold text-white">
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
                            : "Start face verification"}
                </Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}