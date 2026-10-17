import { ChevronLeft, Hash } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import Animated, { SlideInLeft } from "react-native-reanimated";
import { registrationApi } from "../lib/api";

type PersonalRegistrationScreenProps = {
  onBack: () => void;
  onContinue: (values: {
    accountNumber: string;
    bvn: string;
    customerType: "PERSONAL";
    phoneNumber: string;
    email: string;
    firstName: string;
    lastName: string;
    middleName: string;
    branchCode: string;
    domiciledBranch: string;
    dateOfBirth: string;
  }) => void;
  onOtpComplete?: (values: {
    accountNumber: string;
    bvn: string;
    customerType: "PERSONAL";
    phoneNumber: string;
    email: string;
    firstName: string;
    lastName: string;
    middleName: string;
    branchCode: string;
    domiciledBranch: string;
    dateOfBirth: string;
    otpVerified: boolean;
    registrationToken: string;
  }) => void;
  step?: number;
  totalSteps?: number;
};

type FieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  icon: React.ReactNode;
  helperText?: string;
  helperTextColor?: string;
  keyboardType?:
    "default" | "numeric" | "number-pad" | "phone-pad" | "email-address";
  maxLength?: number;
  editable?: boolean;
  onFocus?: () => void;
  onPress?: () => void;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
};

const OTP_LENGTH = 6;

function maskPhoneNumber(value: string) {
  const characters = [...value];
  const digitIndexes = characters.reduce<number[]>(
    (indexes, character, index) => {
      if (/\d/.test(character)) indexes.push(index);
      return indexes;
    },
    []
  );

  digitIndexes.slice(-3).forEach((index) => {
    characters[index] = "*";
  });

  return characters.join("");
}

function maskEmail(value: string) {
  const separatorIndex = value.lastIndexOf("@");
  if (separatorIndex <= 0) return value;

  const localPart = value.slice(0, separatorIndex);
  const domain = value.slice(separatorIndex);
  if (localPart.length === 1) return `*${domain}`;
  if (localPart.length === 2) return `${localPart[0]}*${domain}`;

  return `${localPart[0]}${"*".repeat(localPart.length - 2)}${localPart[localPart.length - 1]}${domain}`;
}

function Toast({
  message,
  type = "error",
  onDismiss
}: {
  message: string;
  type?: "error" | "success";
  onDismiss: () => void;
}) {
  return (
    <View className="absolute inset-0 z-50 flex items-center justify-center bg-black/40">
      <View className="mx-6 w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <View className="flex-col items-center justify-center">
          <View className="mr-4  h-10 w-10 items-center justify-center rounded-full bg-red-500">
            <Text className="text-[20px] font-bold text-white">!</Text>
          </View>
          <View className="flex py-4">
            <Text className="text-[16px] font-outfit-light text-center text-[#1B2D4A] leading-8">
              {message}
            </Text>
          </View>
          <Pressable onPress={onDismiss} className="ml-3 p-1">
            {/* <X size={20} color="#5C6478" /> */}
          </Pressable>
        </View>
        <Pressable
          onPress={onDismiss}
          className="mt-4 rounded-2xl bg-[#123E7C] py-3"
        >
          <Text className="text-center text-[16px] font-outfit-semibold text-white">
            OK
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

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

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  helperText,
  helperTextColor,
  editable = true,
  onFocus,
  onPress,
  autoCapitalize = "sentences",
  ...props
}: FieldProps) {
  return (
    <View>
      <Text className="mb-2 text-[14px] font-outfit-medium text-[#1B2D4A]">
        {label}
      </Text>
      <Pressable onPress={onPress}>
        <View className="relative justify-center">
          <TextInput
            className="rounded-2xl bg-[#ECEDF0] py-5 pl-4 pr-11 text-[14px] font-outfit text-[#1B2D4A]"
            placeholder={placeholder}
            placeholderTextColor="#9AA3B2"
            value={value}
            onChangeText={onChangeText}
            editable={editable}
            onFocus={onFocus}
            pointerEvents={editable ? "auto" : "none"}
            autoCapitalize={autoCapitalize}
            {...props}
          />
          <View className="absolute right-4">{icon}</View>
        </View>
      </Pressable>
      {helperText && (
        <Text
          className={`mt-2 text-[13px] font-medium ${
            helperTextColor || "text-[#8A93A6]"
          }`}
        >
          {helperText}
        </Text>
      )}
    </View>
  );
}

// Renders the 6 visual boxes plus a single invisible TextInput layered on
// top that actually captures the keyboard input — tapping any box focuses
// it, and typing/backspacing updates otpCode as a single string.
function OtpInput({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<TextInput>(null);
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? "");

  return (
    <Pressable
      className="relative flex-row items-center justify-between"
      onPress={() => inputRef.current?.focus()}
    >
      {digits.map((digit, index) => {
        const isActive = index === value.length;
        const isFilled = digit !== "";

        return (
          <View
            key={index}
            className={[
              "h-[72px] w-[48px] items-center justify-center rounded-2xl border-2",
              isFilled
                ? "border-transparent bg-white"
                : isActive
                  ? "border-[#123E7C] bg-white"
                  : "border-transparent bg-[#E9EDF2]"
            ].join(" ")}
          >
            <Text className="text-[32px] font-outfit-bold text-[#1B2D4A]">
              {isFilled ? "*" : ""}
            </Text>
          </View>
        );
      })}

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) =>
          onChange(text.replace(/[^0-9]/g, "").slice(0, OTP_LENGTH))
        }
        keyboardType="number-pad"
        maxLength={OTP_LENGTH}
        secureTextEntry
        accessibilityLabel="Verification code"
        autoFocus
        caretHidden
        className="absolute inset-0 opacity-0"
      />
    </Pressable>
  );
}

export default function PersonalRegistrationScreen({
  onBack,
  onContinue,
  onOtpComplete,
  step = 1,
  totalSteps = 5
}: PersonalRegistrationScreenProps) {
  const [accountNumber, setAccountNumber] = useState("");
  const [bvn, setBvn] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [domiciledBranch, setDomiciledBranch] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [showError, setShowError] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [currentStep, setCurrentStep] = useState(step);
  const [otpCode, setOtpCode] = useState("");
  const [verifiedRegistrationToken, setVerifiedRegistrationToken] =
    useState("");
  const [resendSeconds, setResendSeconds] = useState(0);
  const [isVerifyingAccount, setIsVerifyingAccount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Resend countdown timer
  useEffect(() => {
    if (resendSeconds > 0) {
      const timer = setTimeout(() => {
        setResendSeconds((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendSeconds]);

  const handleContinue = async () => {
    Keyboard.dismiss();
    const accountValue = accountNumber.trim();
    if (isVerifyingAccount || isSubmitting) return;
    if (accountValue.length !== 10) {
      setShowError(true);
      return;
    }

    setShowError(false);
    setIsVerifyingAccount(true);
    try {
      const response = await registrationApi.verifyAccount({
        accountNumber: accountValue,
        customerType: "PERSONAL"
      });

      if (!response.success) {
        throw new Error(response.message || "Account verification failed.");
      }

      const details = response.data;
      setAccountNumber(details.accountNumber || accountValue);
      setBvn(details.bvn || "");
      setFirstName(details.firstName || "");
      setMiddleName(details.middleName || "");
      setLastName(details.lastName || "");
      setPhoneNumber(details.phoneNumber || "");
      setEmail(details.email?.toLowerCase() || "");
      setBranchCode(details.branchCode || "");
      setDomiciledBranch(details.domiciledBranch || "");
      if (details.dateOfBirth) {
        const [year, month, day] = details.dateOfBirth.split("T")[0].split("-");
        if (year && month && day) {
          setDateOfBirth(`${day} / ${month} / ${year}`);
        }
      }

      const otpResponse = await registrationApi.sendOtp({
        accountNumber: details.accountNumber || accountValue,
        tokenType: "REGISTRATION_OTP"
      });
      if (!otpResponse.success) {
        throw new Error(
          otpResponse.message || "Failed to send verification code."
        );
      }

      setCurrentStep(step + 1);
      setOtpCode("");
      setResendSeconds(300);
      setShowOtp(true);
    } catch (error) {
      setToast({
        message:
          error instanceof Error
            ? error.message
            : "Account verification failed. Please try again.",
        type: "error"
      });
    } finally {
      setIsVerifyingAccount(false);
    }
  };

  const handleSubmitDetails = async () => {
    if (isSubmitting) return;
    if (!verifiedRegistrationToken) {
      setToast({
        message: "Verify the code before confirming your details.",
        type: "error"
      });
      return;
    }
    setIsSubmitting(true);

    try {
      const formData = {
        accountNumber,
        bvn,
        customerType: "PERSONAL" as const,
        phoneNumber,
        email,
        firstName,
        lastName,
        middleName,
        branchCode,
        domiciledBranch,
        dateOfBirth,
        otpVerified: true,
        registrationToken: verifiedRegistrationToken
      };
      if (onOtpComplete) {
        onOtpComplete(formData);
      } else {
        onContinue(formData);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (isVerifyingOtp || !isOtpComplete) return;

    setIsVerifyingOtp(true);

    try {
      const response = await registrationApi.verifyOtp({
        accountNumber: accountNumber.trim(),
        otp: otpCode
      });

      if (response.success) {
        const registrationToken = response.data;
        if (!registrationToken) {
          setToast({
            message:
              "OTP verified, but the registration token was missing. Please try again.",
            type: "error"
          });
          return;
        }

        setVerifiedRegistrationToken(registrationToken);
        setCurrentStep(step + 2);
        setShowOtp(false);
        setShowDetails(true);
      } else {
        setToast({ message: response.message, type: "error" });
      }
    } catch (error: any) {
      setToast({
        message: error?.message || "OTP verification failed",
        type: "error"
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const isOtpComplete = otpCode.length === OTP_LENGTH;
  const minutes = Math.floor(resendSeconds / 60);
  const seconds = resendSeconds % 60;
  const resendLabel =
    resendSeconds > 0
      ? `Resend code in ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      : "Resend code";

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F3F5F7]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {toast && (
        <>
          {console.log("Rendering toast:", toast)}
          <Toast
            message={toast.message}
            type={toast.type}
            onDismiss={() => setToast(null)}
          />
        </>
      )}
      <View className="px-6 pt-14">
        <View className="flex-row items-center pt-6">
          <BackButton
            onPress={
              showOtp
                ? () => setShowOtp(false)
                : showDetails
                  ? () => {
                      setShowDetails(false);
                      setShowOtp(true);
                    }
                  : onBack
            }
          />
          <View className="ml-3 flex-1">
            <ProgressBar step={currentStep} totalSteps={totalSteps} />
          </View>
        </View>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-10 pt-7"
        keyboardShouldPersistTaps="handled"
      >
        {!showOtp && !showDetails ? (
          <>
            <Text className="mt-7 text-[26px] font-outfit-semibold text-[#1B2D4A]">
              Personal details
            </Text>
            <Text className="mt-2 text-[15px] font-outfit text-[#8A93A6]">
              Enter your account number to securely retrieve your registered
              details.
            </Text>

            <View className="mt-7 gap-6">
              <Field
                label="Account Number"
                placeholder="10-digit account number"
                value={accountNumber}
                onChangeText={(v) => {
                  setAccountNumber(v.replace(/[^0-9]/g, "").slice(0, 10));
                  setShowError(false);
                }}
                keyboardType="number-pad"
                maxLength={10}
                icon={
                  isVerifyingAccount ? (
                    <ActivityIndicator size="small" color="#123E7C" />
                  ) : showDetails ? (
                    <View className="h-5 w-5 items-center justify-center rounded-full bg-green-500">
                      <Text className="text-[10px] font-bold text-white">
                        ✓
                      </Text>
                    </View>
                  ) : (
                    <Hash size={20} color="#5C6478" />
                  )
                }
                helperText={
                  isVerifyingAccount
                    ? "Validating account number..."
                    : undefined
                }
              />
            </View>

            {showError && (
              <Text className="mt-4 text-sm font-outfit text-rose-500">
                Enter a valid 10-digit account number.
              </Text>
            )}

            <View className="mt-10">
              <Pressable
                accessibilityRole="button"
                disabled={isVerifyingAccount || isSubmitting}
                className={[
                  "flex-row items-center justify-center rounded-2xl bg-[#123E7C] px-5 py-4 active:opacity-80",
                  isVerifyingAccount || isSubmitting ? "opacity-60" : ""
                ].join(" ")}
                onPress={handleContinue}
              >
                {isVerifyingAccount ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Text className="text-base font-outfit-bold text-white">
                      Validate & Continue
                    </Text>
                    <Text className="ml-2  text-[20px] font-light text-white">
                      ›
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </>
        ) : showOtp ? (
          <Animated.View entering={SlideInLeft.duration(400).springify()}>
            <Text className="mt-7 text-[26px] font-outfit-semibold text-[#1B2D4A]">
              Enter code
            </Text>
            <Text className="mt-2 text-[15px] font-outfit text-[#67787F]">
              We sent a 6-digit code to {phoneNumber}
            </Text>

            <View className="mt-8">
              <OtpInput value={otpCode} onChange={setOtpCode} />
            </View>

            <Pressable
              disabled={resendSeconds > 0}
              className={[
                "mt-8 items-center justify-center rounded-3xl border-2 border-[#D4DFFD] bg-[#EEF2F6] px-4 py-4",
                resendSeconds > 0 ? "opacity-80" : ""
              ].join(" ")}
              onPress={async () => {
                setOtpCode("");
                try {
                  const response = await registrationApi.sendOtp({
                    accountNumber: accountNumber.trim(),
                    tokenType: "REGISTRATION_OTP"
                  });
                  if (response.success) {
                    console.log("OTP resent successfully");
                    setResendSeconds(300); // 5 minutes
                  } else {
                    setToast({ message: response.message, type: "error" });
                  }
                } catch (error: any) {
                  setToast({
                    message: error?.message || "Failed to resend OTP",
                    type: "error"
                  });
                }
              }}
            >
              <Text className="text-[18px] font-outfit-semibold text-[#193F7F]">
                {resendLabel}
              </Text>
            </Pressable>

            <View className="mt-4">
              <Pressable
                accessibilityRole="button"
                className={[
                  "flex-row items-center justify-center rounded-[28px] bg-[#123E7C] px-5 py-3",
                  !isOtpComplete || isVerifyingOtp ? "opacity-60" : ""
                ].join(" ")}
                disabled={!isOtpComplete || isVerifyingOtp}
                onPress={handleVerifyOtp}
              >
                {isVerifyingOtp ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Text className="text-[22px] font-outfit-semibold text-white">
                      Verify
                    </Text>
                    <Text className="ml-2 text-[28px] font-light text-white">
                      ›
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </Animated.View>
        ) : (
          <Animated.View entering={SlideInLeft.duration(400).springify()}>
            <Text className="mt-7 text-[26px] font-outfit-semibold text-[#1B2D4A]">
              Confirm your details
            </Text>
            <Text className="mt-2 text-[15px] font-outfit text-[#8A93A6]">
              We retrieved these details using your account number. Review them
              before continuing.
            </Text>
            <View className="mt-7 gap-5">
              {[
                ["Account Number", accountNumber],
                ["BVN", bvn],
                ["First Name", firstName],
                ["Middle Name", middleName],
                ["Last Name", lastName],
                ["Phone Number", phoneNumber],
                ["Email", email],
                ["Date of Birth", dateOfBirth],
                // ["Branch Code", branchCode],
                ["Domiciled Branch", domiciledBranch]
              ]
                .filter(([, value]) => Boolean(value))
                .map(([label, value]) => {
                  const displayValue =
                    label === "Phone Number"
                      ? maskPhoneNumber(value)
                      : label === "Email"
                        ? maskEmail(value)
                        : value;

                  return (
                    <View
                      key={label}
                      className="rounded-2xl bg-[#ECEDF0] px-4 py-3"
                    >
                      <Text className="text-[12px] font-outfit text-[#8A93A6]">
                        {label}
                      </Text>
                      <Text className="mt-1 text-[15px] font-outfit-medium text-[#1B2D4A]">
                        {displayValue}
                      </Text>
                    </View>
                  );
                })}
            </View>
            <View className="mt-8">
              <Pressable
                accessibilityRole="button"
                disabled={isSubmitting}
                className={[
                  "flex-row items-center justify-center rounded-2xl bg-[#123E7C] px-5 py-4",
                  isSubmitting ? "opacity-60" : ""
                ].join(" ")}
                onPress={handleSubmitDetails}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Text className="text-base font-outfit-bold text-white">
                      Continue{" "}
                    </Text>
                    <Text className="ml-2 text-[20px] font-light text-white">
                      ›
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
