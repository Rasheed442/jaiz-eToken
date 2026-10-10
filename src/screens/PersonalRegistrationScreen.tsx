import DateTimePicker from "@react-native-community/datetimepicker";
import { Calendar, ChevronLeft, Hash, Mail, Phone, User } from "lucide-react-native";
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
import Animated, {
  SlideInLeft
} from "react-native-reanimated";
import { registrationApi } from "../lib/api";

type PersonalRegistrationScreenProps = {
  onBack: () => void;
  onContinue: (values: {
    accountNumber: string;
    bvn: string;
    customerType: 'PERSONAL';
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
    customerType: 'PERSONAL';
    phoneNumber: string;
    email: string;
    firstName: string;
    lastName: string;
    middleName: string;
    branchCode: string;
    domiciledBranch: string;
    dateOfBirth: string;
    otpVerified: boolean;
    verificationData?: {
      userPhotoHash: string;
      userPhotoLink: string;
      flowId: string;
      internalVerificationRef: string;
    };
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
  keyboardType?: "default" | "numeric" | "number-pad" | "phone-pad" | "email-address";
  maxLength?: number;
  editable?: boolean;
  onFocus?: () => void;
  onPress?: () => void;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
};

const OTP_LENGTH = 6;
const BVN_LENGTH = 11;

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
              {digit}
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [showOtp, setShowOtp] = useState(false);
  const [currentStep, setCurrentStep] = useState(step);
  const [otpCode, setOtpCode] = useState("");
  const [resendSeconds, setResendSeconds] = useState(0);
  const [isVerifyingBvn, setIsVerifyingBvn] = useState(false);
  const [bvnError, setBvnError] = useState<string | null>(null);
  const [bvnVerified, setBvnVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

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

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day} / ${month} / ${year}`;
  };

  const parseDate = (value: string) => {
    const [day, month, year] = value.split("/").map((part) => part.trim());

    if (!day || !month || !year) {
      return new Date();
    }

    const parsedDay = Number(day);
    const parsedMonth = Number(month) - 1;
    const parsedYear = Number(year);

    if (
      Number.isNaN(parsedDay) ||
      Number.isNaN(parsedMonth) ||
      Number.isNaN(parsedYear)
    ) {
      return new Date();
    }

    return new Date(parsedYear, parsedMonth, parsedDay);
  };

  const formatDateForApi = (value: string) => {
    // Convert from "DD / MM / YYYY" to "YYYY-MM-DD" format for API
    const [day, month, year] = value.split("/").map((part) => part.trim());
    if (!day || !month || !year) {
      return "";
    }
    return `${year}-${month}-${day}`;
  };

  // Verify the BVN once the user has entered all 11 digits.
  // The input is capped at BVN_LENGTH, so reaching that length means the user
  // has finished typing and no debounce is needed. The `cancelled` flag makes
  // sure a slow response for an old BVN can never overwrite the state of a
  // newer one.
  useEffect(() => {
    setBvnVerified(false);
    setBvnError(null);

    if (bvn.length !== BVN_LENGTH) {
      setIsVerifyingBvn(false);
      return;
    }

    let cancelled = false;
    setIsVerifyingBvn(true);

    registrationApi
      .verifyBvn({ bvn })
      .then((response) => {
        if (cancelled) return;
        if (response.success && response.data) {
          setBvnVerified(true);
          // Prefill fields from BVN verification response
          if (response.data.firstName) setFirstName(response.data.firstName);
          if (response.data.lastName) setLastName(response.data.lastName);
          if (response.data.middleName) setMiddleName(response.data.middleName);
          if (response.data.email) setEmail(response.data.email.toLowerCase());
          if (response.data.phoneNumber) setPhoneNumber(response.data.phoneNumber);
          if (response.data.dateOfBirth) {
            // Convert date format from "14-Jun-2002" to "DD / MM / YYYY"
            const dob = response.data.dateOfBirth;
            const parts = dob.split('-');
            if (parts.length === 3) {
              const day = parts[0].padStart(2, '0');
              const monthMap: Record<string, string> = {
                'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
                'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
                'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
              };
              const month = monthMap[parts[1]] || parts[1];
              const year = parts[2];
              setDateOfBirth(`${day} / ${month} / ${year}`);
            }
          }
          if (response.data.branchCode) setBranchCode(response.data.branchCode);
          if (response.data.domiciledBranch) setDomiciledBranch(response.data.domiciledBranch);
          if (response.data.accountNumber) setAccountNumber(response.data.accountNumber);
        } else {
          // Handle failed BVN verification (success: false)
          setBvnError(response.message || "BVN verification failed");
        }
      })
      .catch((error: any) => {
        if (cancelled) return;
        // Show the actual error message from the API response
        const errorMessage = error?.message || "Failed to verify BVN. Please try again.";
        setBvnError(errorMessage);
        setBvnVerified(false);
      })
      .finally(() => {
        if (!cancelled) setIsVerifyingBvn(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bvn]);

  const handleContinue = async () => {
    // Dismiss keyboard
    Keyboard.dismiss();

    // Ignore taps while the BVN request is still in flight.
    if (isVerifyingBvn || isSubmitting) return;

    const accountValue = accountNumber.trim();
    const bvnValue = bvn.trim();
    const phoneNumberValue = phoneNumber.trim();
    const emailValue = email.trim().toLowerCase();
    const firstNameValue = firstName.trim();
    const lastNameValue = lastName.trim();
    const middleNameValue = middleName.trim();
    const branchCodeValue = branchCode.trim();
    const domiciledBranchValue = domiciledBranch.trim();
    const dobValue = dateOfBirth.trim();

    const isValid =
      accountValue.length >= 10 &&
      bvnValue.length >= BVN_LENGTH &&
      phoneNumberValue.length > 0 &&
      emailValue.length > 0 &&
      firstNameValue.length > 0 &&
      lastNameValue.length > 0 &&
      branchCodeValue.length > 0 &&
      domiciledBranchValue.length > 0 &&
      dobValue.length > 0 &&
      bvnVerified;

    if (!isValid) {
      if (!bvnVerified && bvnValue.length === BVN_LENGTH) {
        setBvnError(
          (prev) => prev ?? "BVN could not be verified. Please check it."
        );
      } else {
        setShowError(true);
      }
      return;
    }

    setShowError(false);
    setIsSubmitting(true);

    try {
      const payload = {
        accountNumber: accountValue,
        bvn: bvnValue,
        customerType: "PERSONAL" as const,
        phoneNumber: phoneNumberValue,
        email: emailValue,
        firstName: firstNameValue,
        lastName: lastNameValue,
        middleName: middleNameValue,
        branchCode: branchCodeValue,
        domiciledBranch: domiciledBranchValue,
        dateOfBirth: formatDateForApi(dobValue),
      };
      console.log("Sending registration payload:", payload);
      const response = await registrationApi.initiateRegistration(payload);

      if (response.success) {
        // Send OTP after successful registration initiation
        let otpSent = false;
        try {
          const otpResponse = await registrationApi.sendOtp({
            accountNumber: accountValue,
            tokenType: "REGISTRATION_OTP",
          });
          console.log("OTP sent:", otpResponse);
          otpSent = true;
        } catch (otpError: any) {
          console.error("Failed to send OTP:", otpError);
          // Continue to OTP screen even if OTP send fails
          setToast({
            message: otpError?.message || "Failed to send OTP. Please try resending.",
            type: "error"
          });
        }

        setCurrentStep(step + 1);
        setShowOtp(true);
        if (otpSent) {
          setResendSeconds(300); // 5 minutes
        }
      } else {
        // Handle validation errors from API
        let errorMessages = response.message || "Registration failed. Please check your inputs.";

        // If there are field-specific validation errors, extract and display them
        if (response.data && typeof response.data === 'object' && !('referenceId' in response.data)) {
          const fieldErrors = Object.entries(response.data)
            .map(([field, message]) => {
              const msg = typeof message === 'string' ? message : JSON.stringify(message);
              return msg;
            })
            .join('\n');
          if (fieldErrors) {
            errorMessages = fieldErrors;
          }
        }

        console.log("Setting toast with error:", errorMessages);
        setToast({ message: String(errorMessages), type: "error" });
      }
    } catch (error: any) {
      // Handle API errors
      let errorMessage = error?.message || "Registration failed. Please try again.";

      // If there are field-specific validation errors in the error data
      if (error?.data && typeof error.data === 'object') {
        const fieldErrors = Object.entries(error.data)
          .map(([field, message]) => {
            const msg = typeof message === 'string' ? message : JSON.stringify(message);
            return msg;
          })
          .join('\n');
        if (fieldErrors) {
          errorMessage = fieldErrors;
        }
      }

      console.log("Setting toast with catch error:", errorMessage);
      setToast({ message: String(errorMessage), type: "error" });
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
        otp: otpCode,
      });

      if (response.success) {
        // Call verification endpoint after successful OTP verification
        let verificationData: {
          userPhotoHash: string;
          userPhotoLink: string;
          flowId: string;
          internalVerificationRef: string;
        } | undefined;

        try {
          const verificationResponse = await registrationApi.startVerification({
            bvn: bvn.trim(),
            nin: "", // NIN is not available in this flow
            userId: phoneNumber.trim(),
          });

          if (verificationResponse.success && verificationResponse.status === "SUCCESS") {
            verificationData = {
              userPhotoHash: verificationResponse.userPhotoHash,
              userPhotoLink: verificationResponse.userPhotoLink,
              flowId: verificationResponse.flowId,
              internalVerificationRef: verificationResponse.metadata.internalVerificationRef,
            };
          }
        } catch (verificationError: any) {
          console.error("Verification start failed:", verificationError);
          setToast({
            message: verificationError?.message || "Verification failed. Please try again.",
            type: "error"
          });
          setIsVerifyingOtp(false);
          return;
        }

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
          verificationData,
        };
        if (onOtpComplete) {
          onOtpComplete(formData);
        } else {
          onContinue(formData);
        }
      } else {
        setToast({ message: response.message, type: "error" });
      }
    } catch (error: any) {
      setToast({ message: error?.message || "OTP verification failed", type: "error" });
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
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-10 pt-14"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center pt-6">
          <BackButton onPress={showOtp ? () => setShowOtp(false) : onBack} />
          <View className="ml-3 flex-1">
            <ProgressBar step={currentStep} totalSteps={totalSteps} />
          </View>
        </View>

        {!showOtp ? (
          <>
            <Text className="mt-7 text-[26px] font-outfit-semibold text-[#1B2D4A]">
              Personal details
            </Text>
            <Text className="mt-2 text-[15px] font-outfit text-[#8A93A6]">
              Enter your account information exactly as it appears with the
              bank.
            </Text>

            <View className="mt-7 gap-6">
              <Field
                label="Account Number"
                placeholder="10-digit account number"
                value={accountNumber}
                onChangeText={(v) =>
                  setAccountNumber(v.replace(/[^0-9]/g, "").slice(0, 10))
                }
                keyboardType="number-pad"
                maxLength={10}
                icon={<Hash size={20} color="#5C6478" />}
              />

              <Field
                label="BVN"
                placeholder="11-digit Bank Verification Number"
                value={bvn}
                onChangeText={(v) =>
                  setBvn(v.replace(/[^0-9]/g, "").slice(0, BVN_LENGTH))
                }
                keyboardType="number-pad"
                maxLength={BVN_LENGTH}
                icon={
                  isVerifyingBvn ? (
                    <ActivityIndicator size="small" color="#123E7C" />
                  ) : bvnVerified ? (
                    <View className="h-5 w-5 items-center justify-center rounded-full bg-green-500">
                      <Text className="text-[10px] font-bold text-white">✓</Text>
                    </View>
                  ) : (
                    <Hash size={20} color="#5C6478" />
                  )
                }
                helperText={
                  isVerifyingBvn
                    ? "Verifying your BVN..."
                    : bvnError
                      ? bvnError
                      : bvnVerified
                        ? "BVN verified successfully"
                        : "We use this only to verify your identity."
                }
                helperTextColor={
                  bvnError
                    ? "text-rose-500"
                    : bvnVerified
                      ? "text-green-600"
                      : undefined
                }
              />

              <Field
                label="First Name"
                placeholder="As shown on your account"
                value={firstName}
                onChangeText={setFirstName}
                icon={<User size={20} color="#5C6478" />}
                editable={!bvnVerified}
              />

              <Field
                label="Middle Name"
                placeholder="As shown on your account"
                value={middleName}
                onChangeText={setMiddleName}
                icon={<User size={20} color="#5C6478" />}
                editable={!bvnVerified}
              />

              <Field
                label="Last Name"
                placeholder="As shown on your account"
                value={lastName}
                onChangeText={setLastName}
                icon={<User size={20} color="#5C6478" />}
                editable={!bvnVerified}
              />

              <Field
                label="Phone Number"
                placeholder="+234 XXX XXX XXXX"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                icon={<Phone size={20} color="#5C6478" />}
                editable={!bvnVerified}
              />

              <Field
                label="Email Address"
                placeholder="your@email.com"
                value={email}
                onChangeText={(text) => setEmail(text.toLowerCase())}
                keyboardType="email-address"
                autoCapitalize="none"
                icon={<Mail size={20} color="#5C6478" />}
                editable={!bvnVerified}
              />

              <Field
                label="Date of Birth"
                placeholder="DD / MM / YYYY"
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                editable={!bvnVerified}
                onPress={() => {
                  if (!bvnVerified) {
                    Keyboard.dismiss();
                    setTempDate(dateOfBirth ? parseDate(dateOfBirth) : new Date());
                    setShowDatePicker(true);
                  }
                }}
                onFocus={() => {
                  if (!bvnVerified) {
                    Keyboard.dismiss();
                    setTempDate(dateOfBirth ? parseDate(dateOfBirth) : new Date());
                    setShowDatePicker(true);
                  }
                }}
                icon={<Calendar size={20} color="#5C6478" />}
              />

              <Field
                label="Branch Code"
                placeholder="e.g., 001"
                value={branchCode}
                onChangeText={(v) => setBranchCode(v.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                icon={<Hash size={20} color="#5C6478" />}
              />

              <Field
                label="Domiciled Branch"
                placeholder="e.g., Lagos Main Branch"
                value={domiciledBranch}
                onChangeText={setDomiciledBranch}
                icon={<User size={20} color="#5C6478" />}
              />
            </View>

            {showError && (
              <Text className="mt-4 text-sm font-outfit text-rose-500">
                All fields are required!.
              </Text>
            )}

            <View className="mt-10">
              <Pressable
                accessibilityRole="button"
                disabled={isVerifyingBvn || isSubmitting}
                className={[
                  "flex-row items-center justify-center rounded-2xl bg-[#123E7C] px-5 py-4 active:opacity-80",
                  (isVerifyingBvn || isSubmitting) ? "opacity-60" : ""
                ].join(" ")}
                onPress={handleContinue}
              >
                {isSubmitting ? (
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
        ) : (
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
                    tokenType: "REGISTRATION_OTP",
                  });
                  if (response.success) {
                    console.log("OTP resent successfully");
                    setResendSeconds(300); // 5 minutes
                  } else {
                    setToast({ message: response.message, type: "error" });
                  }
                } catch (error: any) {
                  setToast({ message: error?.message || "Failed to resend OTP", type: "error" });
                }
              }}
            >
              <Text className="text-[18px] font-outfit-semibold text-[#193F7F]">
                {resendLabel}
              </Text>
            </Pressable>

            <View className="mt-14">
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
        )}

        {showDatePicker && (
          <View className="absolute inset-0 justify-end bg-[#0B1F3B]/30">
            <Pressable
              className="flex-1"
              onPress={() => setShowDatePicker(false)}
            />

            <View className="rounded-t-[28px] bg-[#F3F5F7] px-4 pb-8 pt-4">
              <View className="mb-3 flex-row items-center justify-between px-1">
                <Text className="text-[16px] font-outfit-medium text-[#1B2D4A]">
                  Select date of birth
                </Text>
                <Pressable
                  onPress={() => {
                    if (tempDate) {
                      setDateOfBirth(formatDate(tempDate));
                    }
                    setShowDatePicker(false);
                  }}
                >
                  <Text className="text-[15px] font-outfit-semibold text-[#123E7C]">
                    Done
                  </Text>
                </Pressable>
              </View>

              <DateTimePicker
                value={tempDate || new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "calendar"}
                maximumDate={new Date()}
                accentColor="#123E7C"
                textColor="#1B2D4A"
                themeVariant="light"
                onChange={(_, selectedDate) => {
                  if (selectedDate) {
                    setTempDate(selectedDate);
                  }
                }}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}