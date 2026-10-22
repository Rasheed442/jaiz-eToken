import * as Application from "expo-application";
import * as Device from "expo-device";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  Delete,
  Eye,
  EyeOff
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
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

type Step = 1 | 2; // 1: passcode, 2: security questions
type PasscodeField = "create" | "confirm";

const PASSCODE_LENGTH = 6;
const MIN_ANSWER_LENGTH = 2;
const QUESTION_COUNT = 3;

const SECURITY_QUESTIONS = [
  "What was the name of your first school?",
  "What is your mother’s maiden name?",
  "In what city were you born?",
  "What was the make of your first car?",
  "What was the first name of your childhood best friend?",
  "What was the name of your first pet?",
  "What was the surname of your favourite teacher at school?",
  "What was the name of the street where you lived as a child?",
  "What was your childhood nickname?",
  "What was the name of the first organisation you worked for?"
];

const KEYPAD_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"]
];

/* -------------------------------------------------------------------------- */
/*  Small building blocks                                                     */
/* -------------------------------------------------------------------------- */

function ProgressBar({ progress }: { progress: number }) {
  return (
    <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E0E4EA]">
      <View
        className="h-full rounded-full bg-[#123E7C]"
        style={{ width: `${Math.min(1, Math.max(0, progress)) * 100}%` }}
      />
    </View>
  );
}

function Header({
  onBack,
  progress
}: {
  onBack: () => void;
  progress: number;
}) {
  return (
    <View className="flex-row items-center pt-4">
      <Pressable
        accessibilityLabel="Go back"
        accessibilityRole="button"
        onPress={onBack}
        className="mr-3 h-10 w-10 items-center justify-center rounded-full active:bg-[#E4E8EE]"
      >
        <ChevronLeft size={24} color="#1B2D4A" />
      </Pressable>
      <ProgressBar progress={progress} />
    </View>
  );
}

function ScreenTitle({
  step,
  title,
  subtitle
}: {
  step: string;
  title: string;
  subtitle: string;
}) {
  return (
    <View className="mt-6">
      <Text className="text-[13px] font-outfit-medium text-[#67787F]">
        {step}
      </Text>
      <Text className="mt-1 text-[28px] font-outfit-semibold text-[#1B2D4A]">
        {title}
      </Text>
      <Text className="mt-2 text-[15px] font-outfit leading-[22px] text-[#67787F]">
        {subtitle}
      </Text>
    </View>
  );
}

function PasscodeField({
  label,
  filled,
  active,
  onPress
}: {
  label: string;
  filled: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${filled} of ${PASSCODE_LENGTH} digits entered`}
      onPress={onPress}
      className={`rounded-2xl border bg-white px-5 py-4 ${
        active ? "border-[#123E7C]" : "border-[#E3E8EE]"
      }`}
    >
      <Text className="text-[13px] font-outfit-medium text-[#67787F]">
        {label}
      </Text>
      <View className="mt-3 flex-row">
        {Array.from({ length: PASSCODE_LENGTH }).map((_, i) => (
          <View
            key={i}
            // Extra gap after the 3rd dot groups the code as 3 + 3.
            className={`h-3.5 w-3.5 rounded-full ${i === 2 ? "mr-6" : i < PASSCODE_LENGTH - 1 ? "mr-3" : ""} ${
              i < filled ? "bg-[#123E7C]" : "border-2 border-[#D3D9E1]"
            }`}
          />
        ))}
      </View>
    </Pressable>
  );
}

function KeypadButton({
  label,
  onPress,
  children
}: {
  label: string;
  onPress: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="h-16 flex-1 items-center justify-center rounded-2xl active:bg-[#E4E8EE]"
    >
      {children ?? (
        <Text className="text-[26px] font-outfit-medium text-[#1B2D4A]">
          {label}
        </Text>
      )}
    </Pressable>
  );
}

function PrimaryButton({
  title,
  onPress,
  disabled,
  loading
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      className={`h-14 flex-row items-center justify-center rounded-2xl bg-[#123E7C] active:opacity-80 ${
        disabled ? "opacity-40" : ""
      }`}
    >
      {loading && <ActivityIndicator size="small" color="#FFFFFF" />}
      <Text
        className={`text-[17px] font-outfit-semibold text-white ${loading ? "ml-3" : ""}`}
      >
        {title}
      </Text>
    </Pressable>
  );
}

function ErrorText({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <Text
      accessibilityLiveRegion="polite"
      className="mb-3 text-center text-[13px] font-outfit-medium text-[#C62828]"
    >
      {message}
    </Text>
  );
}

/* -------------------------------------------------------------------------- */
/*  Screen                                                                    */
/* -------------------------------------------------------------------------- */

export default function CreateProfileScreen({
  onBack,
  onProfileCreated,
  accountNumber,
  phoneNumber,
  progress = 0.8
}: CreateProfileScreenProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1
  const [passcode, setPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [activeField, setActiveField] = useState<PasscodeField>("create");

  // Step 2
  const [selectedQuestions, setSelectedQuestions] = useState<(string | null)[]>(
    Array(QUESTION_COUNT).fill(null)
  );
  const [securityAnswers, setSecurityAnswers] = useState<string[]>(
    Array(QUESTION_COUNT).fill("")
  );
  const [showAnswers, setShowAnswers] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);

  const answerRefs = useRef<(TextInput | null)[]>([]);
  const enterAnim = useRef(new Animated.Value(0)).current;

  // Fade the security-questions step in when it opens.
  useEffect(() => {
    if (currentStep === 2) {
      enterAnim.setValue(0);
      Animated.timing(enterAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true
      }).start();
    }
  }, [currentStep, enterAnim]);

  const passcodesComplete =
    passcode.length === PASSCODE_LENGTH &&
    confirmPasscode.length === PASSCODE_LENGTH;

  /* ------------------------------ Step 1 logic ----------------------------- */

  const handleDigitPress = (digit: string) => {
    setError(null);
    const value = activeField === "create" ? passcode : confirmPasscode;
    if (value.length >= PASSCODE_LENGTH) return;

    const next = value + digit;
    if (activeField === "create") {
      setPasscode(next);
      // Move straight on to the confirmation row once the first code is complete.
      if (next.length === PASSCODE_LENGTH) setActiveField("confirm");
    } else {
      setConfirmPasscode(next);
    }
  };

  const handleDelete = () => {
    setError(null);
    if (activeField === "create") setPasscode((prev) => prev.slice(0, -1));
    else setConfirmPasscode((prev) => prev.slice(0, -1));
  };

  const handleContinue = () => {
    if (!phoneNumber.trim()) {
      setError("A verified phone number is required to create your profile");
      return;
    }
    if (!passcodesComplete) {
      setError("Enter and confirm your 6-digit passcode");
      return;
    }
    if (passcode !== confirmPasscode) {
      setError("Passcodes do not match. Check both entries and try again.");
      setActiveField("confirm");
      return;
    }
    setError(null);
    setCurrentStep(2);
  };

  // Back steps through the flow instead of leaving the screen straight away.
  const handleBack = () => {
    Keyboard.dismiss();
    setError(null);
    if (currentStep === 2) setCurrentStep(1);
    else onBack();
  };

  /* ------------------------------ Step 2 logic ----------------------------- */

  const answerErrors = securityAnswers.map((answer, index) => {
    if (!selectedQuestions[index]) return "Choose a question";
    const trimmed = answer.trim();
    if (!trimmed) return "Enter an answer";
    if (trimmed.length < MIN_ANSWER_LENGTH) return "Answer is too short";
    return null;
  });

  const handleAnswerChange = (index: number, value: string) => {
    setSecurityAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setError(null);
  };

  const handleSelectQuestion = (question: string) => {
    if (pickerIndex === null) return;
    const index = pickerIndex;

    // Changing the question clears the old answer.
    if (selectedQuestions[index] !== question) {
      setSecurityAnswers((prev) => {
        const next = [...prev];
        next[index] = "";
        return next;
      });
    }
    setSelectedQuestions((prev) => {
      const next = [...prev];
      next[index] = question;
      return next;
    });
    setError(null);
    setPickerIndex(null);
  };

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
      setError("Choose and answer all three security questions");
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
      const securityQuestions = selectedQuestions.map((question, index) => ({
        question: question ?? "",
        answer: securityAnswers[index].trim()
      }));

      // Never log this payload: it contains the passcode and security answers.
      const response = await registrationApi.createProfile({
        accountNumber,
        username: phoneNumber.trim(),
        passcode,
        confirmPasscode,
        securityQuestions
      });
      console.log("Profile created successfully", response?.success ?? "");

      // Register device after profile is created
      let deviceId = "";
      if (Platform.OS === "android") {
        deviceId = Application.getAndroidId() || "";
      } else if (Platform.OS === "ios") {
        deviceId = (await Application.getIosIdForVendorAsync()) || "";
      }

      await registrationApi.registerDevice({
        accountNumber,
        deviceId,
        deviceFingerprint: "sha256_" + deviceId, // Simplified fingerprint
        deviceModel: Device.modelName || "",
        osVersion: `${Platform.OS} ${Device.osVersion}`,
        appVersion: Application.nativeApplicationVersion || "2.1.0",
        enableBiometric: false
      });
      console.log("Device registered successfully");

      // Activate eToken after device registration
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

  /* --------------------------------- Render -------------------------------- */

  return (
    <SafeAreaView className="flex-1 bg-[#F3F5F7]">
      <View className="flex-1 px-6">
        <Header onBack={handleBack} progress={progress} />

        {currentStep === 1 ? (
          <View className="flex-1 pb-6">
            <ScreenTitle
              step="Step 1 of 2"
              title="Create your passcode"
              subtitle="You’ll use this 6-digit passcode to open your token."
            />

            <View className="mt-6">
              <PasscodeField
                label="Passcode"
                filled={passcode.length}
                active={activeField === "create"}
                onPress={() => {
                  setActiveField("create");
                  setError(null);
                }}
              />
              <View className="mt-3">
                <PasscodeField
                  label="Confirm passcode"
                  filled={confirmPasscode.length}
                  active={activeField === "confirm"}
                  onPress={() => {
                    setActiveField("confirm");
                    setError(null);
                  }}
                />
              </View>
            </View>

            <View className="mt-auto">
              <ErrorText message={error} />

              <View className="mb-4">
                {KEYPAD_ROWS.map((row, i) => (
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
                  <View className="flex-1" />
                  <KeypadButton
                    label="0"
                    onPress={() => handleDigitPress("0")}
                  />
                  <KeypadButton label="Delete" onPress={handleDelete}>
                    <Delete size={24} color="#1B2D4A" />
                  </KeypadButton>
                </View>
              </View>

              <PrimaryButton
                title="Continue"
                onPress={handleContinue}
                disabled={!passcodesComplete}
              />
            </View>
          </View>
        ) : (
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
                      outputRange: [12, 0]
                    })
                  }
                ]
              }}
            >
              <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 16 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <ScreenTitle
                  step="Step 2 of 2"
                  title="Security questions"
                  subtitle="Pick three different questions. We’ll ask them if you ever need to recover your profile."
                />

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    showAnswers ? "Hide answers" : "Show answers"
                  }
                  onPress={() => setShowAnswers((v) => !v)}
                  className="mt-4 flex-row items-center self-end active:opacity-70"
                  hitSlop={8}
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

                {Array.from({ length: QUESTION_COUNT }).map((_, index) => {
                  const question = selectedQuestions[index];
                  const fieldError = submitted ? answerErrors[index] : null;
                  const isLast = index === QUESTION_COUNT - 1;

                  return (
                    <View key={index} className="mt-4 rounded-2xl bg-white p-4">
                      <Text className="text-[13px] font-outfit-medium text-[#67787F]">
                        Question {index + 1}
                      </Text>

                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Choose security question ${index + 1}`}
                        onPress={() => {
                          Keyboard.dismiss();
                          setPickerIndex(index);
                        }}
                        className="mt-2 min-h-12 flex-row items-center justify-between py-2 active:opacity-70"
                      >
                        <Text
                          className={`mr-3 flex-1 text-[15px] font-outfit leading-[21px] ${
                            question ? "text-[#1B2D4A]" : "text-[#8793A3]"
                          }`}
                        >
                          {question || "Choose a question"}
                        </Text>
                        <ChevronDown size={20} color="#123E7C" />
                      </Pressable>

                      {question && (
                        <TextInput
                          ref={(r) => {
                            answerRefs.current[index] = r;
                          }}
                          value={securityAnswers[index]}
                          onChangeText={(value) =>
                            handleAnswerChange(index, value)
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
                            } else if (selectedQuestions[index + 1]) {
                              answerRefs.current[index + 1]?.focus();
                            } else {
                              Keyboard.dismiss();
                              setPickerIndex(index + 1);
                            }
                          }}
                          className="mt-2 rounded-xl bg-[#F3F5F7] px-4 py-3.5 text-[16px] font-outfit text-[#1B2D4A]"
                        />
                      )}

                      {fieldError && (
                        <Text className="mt-2 text-[12px] font-outfit text-[#C62828]">
                          {fieldError}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </ScrollView>

              {/* Pinned footer so the action is always reachable */}
              <View className="pb-6 pt-3">
                <ErrorText message={error} />
                <PrimaryButton
                  title={isLoading ? "Creating profile…" : "Create profile"}
                  onPress={handleCreateProfile}
                  disabled={isLoading}
                  loading={isLoading}
                />
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        )}
      </View>

      {/* Question picker */}
      <Modal
        visible={pickerIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerIndex(null)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close question list"
            className="absolute inset-0"
            onPress={() => setPickerIndex(null)}
          />
          <View
            className="rounded-t-[28px] bg-white px-5 pt-3"
            style={{ height: "55%", paddingBottom: 28 }}
          >
            <View className="mb-4 h-1.5 w-10 self-center rounded-full bg-[#D9E1EB]" />
            <Text className="mb-3 text-[20px] font-outfit-semibold text-[#1B2D4A]">
              Choose a question
            </Text>

            <ScrollView
              className="flex-1"
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 12 }}
            >
              {pickerIndex !== null &&
                SECURITY_QUESTIONS.filter(
                  (q) =>
                    q === selectedQuestions[pickerIndex] ||
                    !selectedQuestions.includes(q)
                ).map((q) => {
                  const isSelected = q === selectedQuestions[pickerIndex];
                  return (
                    <Pressable
                      key={q}
                      accessibilityRole="button"
                      onPress={() => handleSelectQuestion(q)}
                      className={`min-h-14 flex-row items-center justify-between rounded-xl px-3 py-3 active:bg-[#F3F5F7] ${
                        isSelected ? "bg-[#EEF4FC]" : ""
                      }`}
                    >
                      <Text className="mr-3 flex-1 text-[15px] font-outfit text-[#1B2D4A]">
                        {q}
                      </Text>
                      {isSelected && <Check size={19} color="#123E7C" />}
                    </Pressable>
                  );
                })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
