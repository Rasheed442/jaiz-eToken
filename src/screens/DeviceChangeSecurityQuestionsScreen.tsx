import { registrationApi } from "@/lib/api";
import { AlertCircle, ChevronLeft, ShieldCheck } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemeToggleButton, useAppTheme } from "@/lib/theme";

type SecurityQuestion = {
  id: number;
  question: string;
};

type DeviceChangeSecurityQuestionsScreenProps = {
  onBack: () => void;
  onNext: () => void;
  phoneNumber: string;
  changeToken: string;
  securityQuestions: SecurityQuestion[];
};

function Field({
  label,
  value,
  onChangeText,
  ...inputProps
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
} & React.ComponentProps<typeof TextInput>) {
  const [focused, setFocused] = useState(false);

  return (
    <View>
      <Text className="mb-2 text-[14px] font-outfit-medium text-[#1B2D4A] dark:text-[#CBD5E1]">{label}</Text>
      <View
        className={`h-[52px] flex-row items-center rounded-xl border bg-white dark:bg-[#131F35] px-4 ${
          focused
            ? "border-[#123E7C] dark:border-[#60A5FA]"
            : "border-[#DDE3EA] dark:border-[#2A3D63]"
        }`}
      >
        <TextInput
          {...inputProps}
          value={value}
          onChangeText={onChangeText}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
          placeholderTextColor="#9AA5B1"
          className="flex-1 text-[16px] font-outfit text-[#1B2D4A] dark:text-white"
        />
      </View>
    </View>
  );
}

function ErrorBanner({ message }: { message: string }) {
  const { isDark } = useAppTheme();

  return (
    <View
      accessibilityRole="alert"
      className="mt-5 flex-row items-start rounded-xl border border-[#F0B4B4] dark:border-[#7F1D1D] bg-[#FDECEC] dark:bg-[#3B1E1E] px-4 py-3"
    >
      <AlertCircle
        size={18}
        color={isDark ? "#F87171" : "#B3261E"}
        style={{ marginTop: 1 }}
      />
      <Text className="ml-2.5 flex-1 text-[13px] leading-[18px] font-outfit-medium text-[#B3261E] dark:text-[#F87171]">
        {message}
      </Text>
    </View>
  );
}

export default function DeviceChangeSecurityQuestionsScreen({
  onBack,
  onNext,
  phoneNumber,
  changeToken,
  securityQuestions
}: DeviceChangeSecurityQuestionsScreenProps) {
  const { isDark } = useAppTheme();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    // Validate all answers are provided
    const allAnswered = securityQuestions.every(q => answers[q.id]?.trim());
    if (!allAnswered) {
      setError("Please answer all security questions.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const answersArray = securityQuestions.map(q => ({
        questionId: q.id,
        answer: answers[q.id].trim()
      }));

      const response = await registrationApi.verifyDeviceChangeSecurityQuestions({
        username: phoneNumber,
        changeToken,
        answers: answersArray
      });

      if (response.success) {
        onNext();
      } else {
        setError(response.message || "Verification failed. Please try again.");
      }
    } catch (err: any) {
      setError(err?.message || "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => error && setError(null);

  return (
    <SafeAreaView className="flex-1 bg-[#F6F8FA] dark:bg-[#070E1E]">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-row items-center justify-between px-6 pt-4">
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center rounded-full border border-[#DDE3EA] dark:border-[#2A3D63] bg-white dark:bg-[#1E2D4A] active:opacity-70"
            onPress={onBack}
          >
            <ChevronLeft size={22} color={isDark ? "#FFFFFF" : "#1B2D4A"} />
          </Pressable>
          <ThemeToggleButton />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View className="h-12 w-12 items-center justify-center rounded-xl bg-[#E6EDF7] dark:bg-[#1E2D4A]">
            <ShieldCheck size={24} color={isDark ? "#60A5FA" : "#123E7C"} />
          </View>
          <Text className="mt-5 text-[26px] leading-[32px] font-outfit-semibold text-[#1B2D4A] dark:text-white">
            Security questions
          </Text>
          <Text className="mt-2 text-[15px] leading-[22px] font-outfit text-[#67787F] dark:text-[#94A3B8]">
            Answer your security questions correctly to continue.
          </Text>

          <View className="mt-8 gap-5">
            {securityQuestions.map((question) => (
              <Field
                key={question.id}
                label={question.question}
                value={answers[question.id] || ""}
                onChangeText={(text) => {
                  clearError();
                  setAnswers(prev => ({ ...prev, [question.id]: text }));
                }}
                placeholder="Your answer"
                autoCapitalize="sentences"
                autoCorrect={false}
              />
            ))}
          </View>

          {error && <ErrorBanner message={error} />}
        </ScrollView>

        <View className="border-t border-[#E3E8EE] dark:border-[#1E293B] px-6 pb-4 pt-4">
          <Pressable
            accessibilityRole="button"
            onPress={handleSubmit}
            disabled={isLoading}
            className={`h-14 flex-row items-center justify-center rounded-2xl bg-[#123E7C] active:opacity-85 ${
              isLoading ? "opacity-70" : ""
            }`}
          >
            {isLoading && <ActivityIndicator size="small" color="#FFFFFF" />}
            <Text
              className={`text-[17px] font-outfit-semibold text-white ${isLoading ? "ml-3" : ""}`}
            >
              {isLoading ? "Verifying..." : "Continue"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
