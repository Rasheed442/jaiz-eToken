import * as Application from "expo-application";
import * as Device from "expo-device";
import {
  Check,
  ChevronLeft,
  Delete,
  Eye,
  EyeOff,
  ShieldCheck
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { registrationApi } from "../lib/api";
import { authStorage } from "../lib/auth/storage";

type CreateProfileScreenProps = {
  onBack: () => void;
  onProfileCreated: () => void;
  accountNumber: string;
  phoneNumber: string;
  progress?: number; // 0-1, for the top progress bar
};

const PASSCODE_LENGTH = 6;
const MIN_ANSWER_LENGTH = 2;

// Same questions as before, so the payload the API receives is unchanged.
const SECURITY_QUESTIONS = [
  "What was the name of your first school?",
  "What is your mother's maiden name?",
  "In what city were you born?"
];

type Step = 1 | 2 | 3; // 1: enter passcode, 2: confirm passcode, 3: security questions

function ProgressBar({ progress }: { progress: number }) {
  return (
    <View className="h-2.5 w-full overflow-hidden rounded-full bg-[#E0E0E0]">
      <View
        className="h-full rounded-full bg-[#123E7C]"
        style={{ width: `${Math.min(1, Math.max(0, progress)) * 100}%` }}
      />
    </View>
  );
}

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel="Go back"
      accessibilityRole="button"
      className="h-10 w-10 items-center justify-center rounded-xl bg-[#E8E8E8] active:opacity-70"
      onPress={onPress}
    >
      <ChevronLeft size={22} color="#1B2D4A" />
    </Pressable>
  );
}

function PasscodeDots({ length, filled }: { length: number; filled: number }) {
  return (
    <View className="mt-4 flex-row items-start justify-start">
      {Array.from({ length }).map((_, i) => {
        const isFilled = i < filled;
        return (
          <View key={i} className="flex-row items-center">
            <View
              className={`h-4 w-4 rounded-full ${
                isFilled ? "bg-[#123E7C]" : "border-2 border-[#D6D6D6]"
              }`}
            />
            {i === 2 && i < length - 1 && (
              <View className="mx-2 h-0.5 w-5 bg-[#D6D6D6]" />
            )}
            {i < length - 1 && i !== 2 && <View className="w-4" />}
          </View>
        );
      })}
    </View>
  );
}

function KeypadButton({
  label,
  onPress,
  icon
}: {
  label?: string;
  onPress: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label ?? "Delete"}
      onPress={onPress}
      className="h-20 flex-1 items-center justify-center active:opacity-70"
    >
      {icon ? (
        icon
      ) : (
        <Text className="text-[28px] font-outfit-medium text-[#1B2D4A]">
          {label}
        </Text>
      )}
    </Pressable>
  );
}

function StepPill({ text }: { text: string }) {
  return (
    <View className="rounded-full border border-gray-100 bg-[#F2F2F4] px-8 py-5">
      <Text className="text-[16px] font-outfit-medium text-[#67787F]">
        {text}
      </Text>
    </View>
  );
}

export default function CreateProfileScreen({
  onBack,
  onProfileCreated,
  accountNumber,
  phoneNumber,
  progress = 0.8
}: CreateProfileScreenProps) {
  const [passcode, setPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [securityAnswers, setSecurityAnswers] = useState<string[]>(
    SECURITY_QUESTIONS.map(() => "")
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [showAnswers, setShowAnswers] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const answerRefs = useRef<(TextInput | null)[]>([]);
  const transitioningRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Entrance animation for the security-questions step.
  // (Bug that hid this step before: it faded in using a value that was left at 0.)
  const enterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (currentStep === 3) {
      enterAnim.setValue(0);
      Animated.timing(enterAnim, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true
      }).start();
    }
  }, [currentStep, enterAnim]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Lets the last passcode dot fill in visibly before the screen changes.
  const runAfterDelay = (fn: () => void, ms = 250) => {
    transitioningRef.current = true;
    timerRef.current = setTimeout(() => {
      fn();
      transitioningRef.current = false;
    }, ms);
  };

  const handleDigitPress = (digit: string) => {
    Keyboard.dismiss();

    if (transitioningRef.current) return;
    setError(null);

    if (!phoneNumber.trim()) {
      setError("A verified phone number is required to create your profile");
      return;
    }

    if (currentStep === 1) {
      if (passcode.length >= PASSCODE_LENGTH) return;
      const next = passcode + digit;
      setPasscode(next);
      if (next.length === PASSCODE_LENGTH) {
        runAfterDelay(() => setCurrentStep(2));
      }
    } else if (currentStep === 2) {
      if (confirmPasscode.length >= PASSCODE_LENGTH) return;
      const next = confirmPasscode + digit;
      setConfirmPasscode(next);
      if (next.length === PASSCODE_LENGTH) {
        if (next === passcode) {
          runAfterDelay(() => setCurrentStep(3));
        } else {
          runAfterDelay(() => {
            setError("Passcodes do not match. Please try again.");
            setConfirmPasscode("");
          });
        }
      }
    }
  };

  const handleDelete = () => {
    if (transitioningRef.current) return;
    setError(null);
    if (currentStep === 1) {
      setPasscode((prev) => prev.slice(0, -1));
    } else if (currentStep === 2) {
      setConfirmPasscode((prev) => prev.slice(0, -1));
    }
  };

  // Back steps through the flow instead of leaving the screen straight away.
  const handleBack = () => {
    Keyboard.dismiss();
    setError(null);
    if (currentStep === 3) {
      setConfirmPasscode("");
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setPasscode("");
      setConfirmPasscode("");
      setCurrentStep(1);
    } else {
      onBack();
    }
  };

  const handleSecurityAnswerChange = (index: number, value: string) => {
    setSecurityAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setError(null);
  };

  const answerErrors = securityAnswers.map((answer) => {
    const trimmed = answer.trim();
    if (!trimmed) return "Please answer this question";
    if (trimmed.length < MIN_ANSWER_LENGTH) return "Answer is too short";
    return null;
  });
  const answeredCount = securityAnswers.filter(
    (a) => a.trim().length >= MIN_ANSWER_LENGTH
  ).length;

  const validateForm = (): boolean => {
    if (!phoneNumber.trim()) {
      setError("A verified phone number is required");
      return false;
    }
    if (passcode.length !== PASSCODE_LENGTH) {
      setError("Passcode must be 6 digits");
      return false;
    }
    if (passcode !== confirmPasscode) {
      setError("Passcodes do not match");
      return false;
    }
    if (answerErrors.some(Boolean)) {
      setError("Please answer all security questions");
      return false;
    }
    return true;
  };

  const handleCreateProfile = async () => {
    if (isLoading) return;
    Keyboard.dismiss();
    setSubmitted(true);
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      const securityQuestions = SECURITY_QUESTIONS.map((question, index) => ({
        question,
        answer: securityAnswers[index].trim()
      }));

      const payload = {
        accountNumber,
        username: phoneNumber.trim(),
        passcode,
        confirmPasscode,
        securityQuestions
      };

      // Never log the payload: it contains the passcode and security answers.
      const response = await registrationApi.createProfile(payload);
      console.log("Profile created successfully", response?.success ?? "");

      // Register device after profile is created
      let deviceId = "";
      if (Platform.OS === "android") {
        deviceId = Application.getAndroidId() || "";
      } else if (Platform.OS === "ios") {
        deviceId = (await Application.getIosIdForVendorAsync()) || "";
      }

      const deviceModel = Device.modelName || "";
      const osVersion = `${Platform.OS} ${Device.osVersion}`;
      const appVersion = Application.nativeApplicationVersion || "2.1.0";

      const devicePayload = {
        accountNumber,
        deviceId,
        deviceFingerprint: "sha256_" + deviceId, // Simplified fingerprint
        deviceModel,
        osVersion,
        appVersion,
        enableBiometric: false
      };

      console.log("Registering device...");
      await registrationApi.registerDevice(devicePayload);
      console.log("Device registered successfully");

      // Activate eToken after device registration
      console.log("Activating eToken...");
      const activationResponse =
        await registrationApi.activateEtoken(accountNumber);
      console.log(
        "eToken activated successfully",
        activationResponse?.success ?? ""
      );

      if (!activationResponse?.success || !activationResponse.data) {
        setError(activationResponse?.message || "Failed to activate eToken.");
        return;
      }

      // Store authentication data before moving to the activation screen.
      await authStorage.setAuthData({
        accessToken: activationResponse.data.accessToken,
        refreshToken: activationResponse.data.refreshToken,
        username: activationResponse.data.username,
        customerName: activationResponse.data.customerName,
        accountNumber,
        passcode,
        deviceId
      });

      onProfileCreated();
    } catch (err: any) {
      console.error("Profile creation failed:", err?.message ?? err);
      setError(err?.message || "Failed to create profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const keypadRows = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"]
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#F3F5F7]">
      <View className="flex-1 px-6 pb-6">
        <View className="flex-row items-center pt-6">
          <BackButton onPress={handleBack} />
          <View className="ml-3 flex-1">
            <ProgressBar progress={progress} />
          </View>
        </View>

        {/*
          Steps 1 and 2 (passcode keypad) do not need keyboard avoidance.
        */}
        {currentStep < 3 && (
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
            <View className="flex-1">
              <Text className="mt-5 text-[26px] font-outfit-semibold text-[#1B2D4A]">
                Create your profile
              </Text>
              <Text className="mt-2 text-[15px] font-outfit text-[#67787F]">
                Create a 6-digit passcode to protect your token.
              </Text>

              <View className="mt-5 flex-row items-center justify-between">
                <Text className="text-[14px] font-outfit-medium text-[#1B2D4A]">
                  {currentStep === 1
                    ? "Enter 6-digit passcode"
                    : "Confirm 6-digit passcode"}
                </Text>
                <StepPill
                  text={currentStep === 1 ? "Step 1 of 3" : "Step 2 of 3"}
                />
              </View>

              <PasscodeDots
                length={PASSCODE_LENGTH}
                filled={
                  currentStep === 1 ? passcode.length : confirmPasscode.length
                }
              />

              {error && (
                <Text className="mt-5 text-center text-[13px] font-outfit-light text-[#D32F2F]">
                  {error}
                </Text>
              )}

              <View className="mt-auto rounded-3xl bg-[#E8E8E8] px-4 pb-4 pt-2">
                {keypadRows.map((row, i) => (
                  <View key={i} className="flex-row">
                    {row.map((digit) => (
                      <KeypadButton
                        key={digit}
                        label={digit}
                        onPress={() => handleDigitPress(digit)}
                      />
                    ))}
                  </View>
                ))}
                <View className="flex-row">
                  <View className="h-20 flex-1" />
                  <KeypadButton
                    label="0"
                    onPress={() => handleDigitPress("0")}
                  />
                  <KeypadButton
                    onPress={handleDelete}
                    icon={<Delete size={22} color="#1B2D4A" />}
                  />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        )}

        {/* Step 3 (security questions): this is the only step that needs to move above the keyboard. */}
        {currentStep === 3 && (
          <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <Animated.View
              style={{
                flex: 1,
                opacity: enterAnim,
                transform: [
                  {
                    translateY: enterAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0]
                    })
                  }
                ]
              }}
            >
              <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 24 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* Header */}
                <View className="mt-7 flex-row items-center justify-between">
                  <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#E6EDF7]">
                    <ShieldCheck size={26} color="#123E7C" />
                  </View>
                  <StepPill text="Step 3 of 3" />
                </View>

                <Text className="mt-4 text-[26px] font-outfit-semibold text-[#1B2D4A]">
                  Security questions
                </Text>
                <Text className="mt-2 text-[15px] font-outfit leading-[22px] text-[#67787F]">
                  Answer these three questions. Pick answers only you would
                  know.
                </Text>

                {/* Answered counter + show/hide toggle */}
                <View className="mt-5 flex-row items-center justify-between">
                  <Text className="text-[13px] font-outfit-medium text-[#67787F]">
                    {answeredCount} of {SECURITY_QUESTIONS.length} answered
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      showAnswers ? "Hide answers" : "Show answers"
                    }
                    onPress={() => setShowAnswers((v) => !v)}
                    className="flex-row items-center active:opacity-70"
                  >
                    {showAnswers ? (
                      <EyeOff size={16} color="#123E7C" />
                    ) : (
                      <Eye size={16} color="#123E7C" />
                    )}
                    <Text className="ml-1.5 text-[13px] font-outfit-medium text-[#123E7C]">
                      {showAnswers ? "Hide answers" : "Show answers"}
                    </Text>
                  </Pressable>
                </View>

                {/* Question cards */}
                {SECURITY_QUESTIONS.map((question, index) => {
                  const isDone = !answerErrors[index];
                  const isFocused = focusedIndex === index;
                  const showFieldError = submitted && !!answerErrors[index];
                  const isLast = index === SECURITY_QUESTIONS.length - 1;

                  return (
                    <View
                      key={question}
                      className={`mt-4 rounded-2xl border bg-white p-4 ${
                        isFocused
                          ? "border-[#123E7C]"
                          : showFieldError
                            ? "border-[#F0B4B4]"
                            : "border-[#E3E8EE]"
                      }`}
                    >
                      <View className="flex-row items-start">
                        <View
                          className={`h-7 w-7 items-center justify-center rounded-full ${
                            isDone ? "bg-[#123E7C]" : "bg-[#E6EDF7]"
                          }`}
                        >
                          {isDone ? (
                            <Check size={15} color="#FFFFFF" />
                          ) : (
                            <Text className="text-[13px] font-outfit-semibold text-[#123E7C]">
                              {index + 1}
                            </Text>
                          )}
                        </View>
                        <Text className="ml-3 flex-1 text-[15px] font-outfit-medium leading-[21px] text-[#1B2D4A]">
                          {question}
                        </Text>
                      </View>

                      <TextInput
                        ref={(r) => {
                          answerRefs.current[index] = r;
                        }}
                        value={securityAnswers[index]}
                        onChangeText={(value) =>
                          handleSecurityAnswerChange(index, value)
                        }
                        onFocus={() => setFocusedIndex(index)}
                        onBlur={() =>
                          setFocusedIndex((cur) => (cur === index ? null : cur))
                        }
                        placeholder="Your answer"
                        placeholderTextColor="#9AA5B1"
                        secureTextEntry={!showAnswers}
                        autoCapitalize="words"
                        autoCorrect={false}
                        autoComplete="off"
                        returnKeyType={isLast ? "done" : "next"}
                        blurOnSubmit={isLast}
                        onSubmitEditing={() => {
                          if (isLast) {
                            handleCreateProfile();
                          } else {
                            answerRefs.current[index + 1]?.focus();
                          }
                        }}
                        className="mt-3 rounded-xl bg-[#F3F5F7] px-4 py-3.5 text-[16px] font-outfit text-[#1B2D4A]"
                      />

                      {showFieldError && (
                        <Text className="mt-2 text-[12px] font-outfit text-[#D32F2F]">
                          {answerErrors[index]}
                        </Text>
                      )}
                    </View>
                  );
                })}

                {/* Info note */}
                <View className="mt-5 flex-row items-start rounded-2xl bg-[#EAF1FB] p-4">
                  <ShieldCheck size={18} color="#123E7C" />
                  <Text className="ml-3 flex-1 text-[13px] font-outfit leading-[19px] text-[#35506E]">
                    These answers help verify it&apos;s really you if you need
                    to recover your profile. Keep them private and easy for you
                    to remember.
                  </Text>
                </View>

                {error && (
                  <View className="mt-5 rounded-2xl border border-[#F0B4B4] bg-[#FDECEC] px-4 py-3">
                    <Text className="text-center text-[13px] font-outfit-medium text-[#B3261E]">
                      {error}
                    </Text>
                  </View>
                )}

                <Pressable
                  accessibilityRole="button"
                  onPress={handleCreateProfile}
                  disabled={isLoading}
                  className={`mt-6 flex-row items-center justify-center rounded-[28px] bg-[#123E7C] px-5 py-4 active:opacity-80 ${
                    isLoading ? "opacity-70" : ""
                  }`}
                >
                  {isLoading && (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  )}
                  <Text
                    className={`text-[18px] font-outfit-semibold text-white ${isLoading ? "ml-3" : ""}`}
                  >
                    {isLoading ? "Creating profile..." : "Create Profile"}
                  </Text>
                </Pressable>
              </ScrollView>
            </Animated.View>
          </KeyboardAvoidingView>
        )}
      </View>
    </SafeAreaView>
  );
}
