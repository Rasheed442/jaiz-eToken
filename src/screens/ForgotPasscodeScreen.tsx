import {
  AlertCircle,
  Check,
  ChevronLeft,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck
} from "lucide-react-native";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TextInputProps,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { registrationApi } from "../lib/api";

const PASSCODE_LENGTH = 6;
const OTP_LENGTH = 6;
const TOTAL_STEPS = 3;

function getQuestionText(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (!value || typeof value !== "object") return null;

  const question = value as Record<string, unknown>;
  for (const key of ["question", "questionText", "securityQuestion", "text", "label"]) {
    const candidate = question[key];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return null;
}

function extractSecurityQuestions(response: unknown): string[] {
  const seen = new Set<unknown>();
  const findQuestions = (value: unknown, depth = 0): string[] => {
    if (!value || depth > 4 || seen.has(value)) return [];
    if (typeof value === "object") seen.add(value);

    if (Array.isArray(value)) {
      const questions = value
        .map(getQuestionText)
        .filter((question): question is string => Boolean(question));
      if (questions.length) return questions;
      for (const item of value) {
        const nestedQuestions = findQuestions(item, depth + 1);
        if (nestedQuestions.length) return nestedQuestions;
      }
      return [];
    }

    if (typeof value === "object") {
      const record = value as Record<string, unknown>;
      for (const key of ["securityQuestions", "questions", "data", "result"]) {
        const nestedQuestions = findQuestions(record[key], depth + 1);
        if (nestedQuestions.length) return nestedQuestions;
      }
    }
    return [];
  };

  return findQuestions(response);
}

type Step = 1 | 2 | 3; // 1: account verification, 2: security questions, 3: reset passcode

type ForgotPasscodeScreenProps = {
  onBack: () => void;
  onComplete: () => void;
  username?: string;
  accountNumber?: string;
};

const STEP_CONTENT: Record<Step, { title: string; subtitle: string }> = {
  1: {
    title: "Reset your passcode",
    subtitle: "Enter your account details so we can verify it's you."
  },
  2: {
    title: "Answer your security questions",
    subtitle: "Use the answers you set up when you created your account."
  },
  3: {
    title: "Create a new passcode",
    subtitle: "Enter the 6-digit code we sent you, then choose a new passcode."
  }
};

/* ---------- Small building blocks ---------- */

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <View className="flex-1 flex-row items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className={`h-1 flex-1 rounded-full ${
            i < current ? "bg-[#123E7C]" : "bg-[#D9E0E8]"
          }`}
        />
      ))}
    </View>
  );
}

function Field({
  label,
  trailing,
  ...inputProps
}: TextInputProps & { label: string; trailing?: React.ReactNode }) {
  const [focused, setFocused] = useState(false);

  return (
    <View>
      <Text className="mb-2 text-[14px] font-outfit-medium text-[#1B2D4A]">{label}</Text>
      <View
        className={`h-[52px] flex-row items-center rounded-xl border bg-white px-4 ${
          focused ? "border-[#123E7C]" : "border-[#DDE3EA]"
        }`}
      >
        <TextInput
          {...inputProps}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
          placeholderTextColor="#9AA5B1"
          className="flex-1 text-[16px] font-outfit text-[#1B2D4A]"
        />
        {trailing}
      </View>
    </View>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <View
      accessibilityRole="alert"
      className="mt-5 flex-row items-start rounded-xl border border-[#F0B4B4] bg-[#FDECEC] px-4 py-3"
    >
      <AlertCircle size={18} color="#B3261E" style={{ marginTop: 1 }} />
      <Text className="ml-2.5 flex-1 text-[13px] leading-[18px] font-outfit-medium text-[#B3261E]">
        {message}
      </Text>
    </View>
  );
}

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<TextInput>(null);

  return (
    <View>
      <Text className="mb-2 text-[14px] font-outfit-medium text-[#1B2D4A]">
        Verification code
      </Text>
      <Pressable onPress={() => inputRef.current?.focus()}>
        <View className="flex-row justify-between">
          {Array.from({ length: OTP_LENGTH }).map((_, i) => {
            const isActive = i === value.length;
            return (
              <View
                key={i}
                className={`h-14 w-[46px] items-center justify-center rounded-xl border bg-white ${
                  isActive ? "border-[#123E7C]" : "border-[#DDE3EA]"
                }`}
              >
                <Text className="text-[22px] font-outfit-semibold text-[#1B2D4A]">
                  {value[i] ?? ""}
                </Text>
              </View>
            );
          })}
        </View>
        {/* Invisible input captures typing, paste and SMS autofill */}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={(t) => onChange(t.replace(/\D/g, "").slice(0, OTP_LENGTH))}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          maxLength={OTP_LENGTH}
          caretHidden
          accessibilityLabel="Verification code"
          style={{ position: "absolute", width: "100%", height: "100%", opacity: 0.02 }}
        />
      </Pressable>
    </View>
  );
}

/* ---------- Screen ---------- */

export default function ForgotPasscodeScreen({
  onBack,
  onComplete,
  username: initialUsername = "",
  accountNumber: initialAccountNumber = ""
}: ForgotPasscodeScreenProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [username, setUsername] = useState(initialUsername);
  const [accountNumber, setAccountNumber] = useState(initialAccountNumber);
  const [securityQuestions, setSecurityQuestions] = useState<string[]>([]);
  const [securityAnswers, setSecurityAnswers] = useState<string[]>([]);
  const [otp, setOtp] = useState("");
  const [newPasscode, setNewPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleBack = () => {
    if (isLoading) return;
    if (currentStep > 1) {
      setError(null);
      setCurrentStep((currentStep - 1) as Step);
    } else {
      onBack();
    }
  };

  const handleStep1Submit = async () => {
    if (!username.trim() || !accountNumber.trim()) {
      setError("Enter your username and account number to continue.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await registrationApi.getSecurityQuestions(
        accountNumber.trim()
      );
      if (
        response &&
        typeof response === "object" &&
        "success" in response &&
        response.success === false
      ) {
        throw new Error(
          "We couldn't load your security questions. Check your account number and try again."
        );
      }

      const questions = extractSecurityQuestions(response);
      if (!questions.length) {
        throw new Error(
          "No security questions were found for this account. Check your account number and try again."
        );
      }

      setSecurityQuestions(questions);
      setSecurityAnswers(questions.map(() => ""));
      setCurrentStep(2);
    } catch (err: any) {
      setError(
        err?.message || "We couldn't load your security questions. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Submit = async () => {
    if (!securityQuestions.length || securityAnswers.some((a) => !a.trim())) {
      setError("Answer all security questions to continue.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First call forgot passcode API
      await registrationApi.forgotPasscode({
        username: username.trim(),
        accountNumber: accountNumber.trim()
      });

      // Then verify security questions
      const answersPayload: Record<string, string> = {};
      securityQuestions.forEach((question, index) => {
        answersPayload[question] = securityAnswers[index].trim();
      });

      await registrationApi.verifySecurityQuestions(username.trim(), answersPayload);
      setCurrentStep(3);
    } catch (err: any) {
      setError(err?.message || "We couldn't verify your answers. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep3Submit = async () => {
    if (otp.length !== OTP_LENGTH) {
      setError("Enter the 6-digit verification code.");
      return;
    }
    if (newPasscode.length !== PASSCODE_LENGTH) {
      setError("Your new passcode must be 6 digits.");
      return;
    }
    if (newPasscode !== confirmPasscode) {
      setError("The passcodes don't match. Check both entries and try again.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await registrationApi.resetPasscode({
        accountNumber: accountNumber.trim(),
        newPasscode,
        confirmPasscode,
        otp
      });

      if (response.success) {
        setSuccessMessage(response.message || "Passcode reset successfully!");
        setShowSuccessModal(true);
      }
    } catch (err: any) {
      setError(err?.message || "We couldn't reset your passcode. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    onComplete();
  };

  const handlers: Record<Step, () => void> = {
    1: handleStep1Submit,
    2: handleStep2Submit,
    3: handleStep3Submit
  };

  const ctaLabel = {
    1: { idle: "Continue", busy: "Verifying..." },
    2: { idle: "Continue", busy: "Verifying..." },
    3: { idle: "Reset passcode", busy: "Resetting..." }
  }[currentStep];

  const Icon = currentStep === 2 ? ShieldCheck : Lock;
  const { title, subtitle } = STEP_CONTENT[currentStep];

  const clearError = () => error && setError(null);

  const digitsOnly = (setter: (v: string) => void) => (t: string) => {
    clearError();
    setter(t.replace(/\D/g, "").slice(0, PASSCODE_LENGTH));
  };

  const visibilityToggle = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={showPasscode ? "Hide passcode" : "Show passcode"}
      hitSlop={10}
      onPress={() => setShowPasscode((v) => !v)}
    >
      {showPasscode ? <EyeOff size={20} color="#67787F" /> : <Eye size={20} color="#67787F" />}
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F6F8FA]">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header: back + progress */}
        <View className="flex-row items-center px-6 pt-4">
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center rounded-full border border-[#DDE3EA] bg-white active:opacity-70"
            onPress={handleBack}
          >
            <ChevronLeft size={22} color="#1B2D4A" />
          </Pressable>
          <View className="ml-4 flex-1">
            <ProgressBar current={currentStep} total={TOTAL_STEPS} />
          </View>
          <Text className="ml-4 text-[13px] font-outfit-medium text-[#67787F]">
            {currentStep}/{TOTAL_STEPS}
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* Title block */}
          <View className="h-12 w-12 items-center justify-center rounded-xl bg-[#E6EDF7]">
            <Icon size={24} color="#123E7C" />
          </View>
          <Text className="mt-5 text-[26px] leading-[32px] font-outfit-semibold text-[#1B2D4A]">
            {title}
          </Text>
          <Text className="mt-2 text-[15px] leading-[22px] font-outfit text-[#67787F]">
            {subtitle}
          </Text>

          {/* Step 1 */}
          {currentStep === 1 && (
            <View className="mt-8 gap-5">
              <Field
                label="Username"
                value={username}
                onChangeText={(t) => {
                  clearError();
                  setUsername(t);
                }}
                placeholder="Enter your username"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="username"
                returnKeyType="next"
              />
              <Field
                label="Account number"
                value={accountNumber}
                onChangeText={(t) => {
                  clearError();
                  setAccountNumber(t);
                }}
                placeholder="Enter your account number"
                keyboardType="number-pad"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}

          {/* Step 2 */}
          {currentStep === 2 && (
            <View className="mt-8 gap-5">
              {securityQuestions.map((question, index) => (
                <Field
                  key={question}
                  label={question}
                  value={securityAnswers[index]}
                  onChangeText={(value) => {
                    const next = [...securityAnswers];
                    next[index] = value;
                    setSecurityAnswers(next);
                    clearError();
                  }}
                  placeholder="Your answer"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              ))}
            </View>
          )}

          {/* Step 3 */}
          {currentStep === 3 && (
            <View className="mt-8 gap-6">
              <OtpInput
                value={otp}
                onChange={(v) => {
                  clearError();
                  setOtp(v);
                }}
              />

              <View className="h-px bg-[#E3E8EE]" />

              <Field
                label="New passcode"
                value={newPasscode}
                onChangeText={digitsOnly(setNewPasscode)}
                placeholder="6 digits"
                keyboardType="number-pad"
                secureTextEntry={!showPasscode}
                maxLength={PASSCODE_LENGTH}
                autoCapitalize="none"
                autoCorrect={false}
                trailing={visibilityToggle}
              />
              <Field
                label="Confirm new passcode"
                value={confirmPasscode}
                onChangeText={digitsOnly(setConfirmPasscode)}
                placeholder="Re-enter your passcode"
                keyboardType="number-pad"
                secureTextEntry={!showPasscode}
                maxLength={PASSCODE_LENGTH}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}

          {error && <ErrorBanner message={error} />}
        </ScrollView>

        {/* Pinned action bar */}
        <View className="border-t border-[#E3E8EE] px-6 pb-4 pt-4">
          <Pressable
            accessibilityRole="button"
            onPress={handlers[currentStep]}
            disabled={isLoading}
            className={`h-14 flex-row items-center justify-center rounded-2xl bg-[#123E7C] active:opacity-85 ${
              isLoading ? "opacity-70" : ""
            }`}
          >
            {isLoading && <ActivityIndicator size="small" color="#FFFFFF" />}
            <Text
              className={`text-[17px] font-outfit-semibold text-white ${isLoading ? "ml-3" : ""}`}
            >
              {isLoading ? ctaLabel.busy : ctaLabel.idle}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={handleSuccessModalClose}
      >
        <View className="flex-1 items-center justify-center bg-black/50 px-6">
          <Animated.View
            className="w-full max-w-sm rounded-3xl bg-white p-6"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8
            }}
          >
            <View className="h-16 w-16 items-center justify-center self-center mt-4 rounded-full bg-[#E6F4EA]">
              <Check size={32} color="#1E8E5A" />
            </View>

            <Text className="mt-10 text-center text-[22px] font-outfit-semibold text-[#1B2D4A]">
              Passcode Reset Successfully
            </Text>

            <Text className="mt-3 text-center text-[15px] font-light text-[#67787F] leading-[22px]">
              {successMessage}
            </Text>


            <Pressable
              accessibilityRole="button"
              onPress={handleSuccessModalClose}
              className="mt-6 h-12 flex-row items-center justify-center rounded-2xl bg-[#123E7C] active:opacity-85"
            >
              <Text className="text-[17px] font-outfit-semibold text-white">
                Done
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
