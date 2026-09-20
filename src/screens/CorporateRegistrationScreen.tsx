import DateTimePicker from "@react-native-community/datetimepicker";
import { Building2, Calendar, ChevronLeft, Hash, Mail, User } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
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

type CorporateRegistrationScreenProps = {
  onBack: () => void;
  onContinue: (values: {
    corporateAccountNumber: string;
    businessEmail: string;
    bvn: string;
    dateOfBirth: string;
    lastName: string;
  }) => void;
  onOtpComplete?: (values: {
    corporateAccountNumber: string;
    businessEmail: string;
    bvn: string;
    dateOfBirth: string;
    lastName: string;
  }) => void;
  onDocumentsSubmit?: (values: {
    corporateAccountNumber: string;
    businessEmail: string;
    bvn: string;
    dateOfBirth: string;
    lastName: string;
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
  keyboardType?: "default" | "numeric" | "number-pad" | "email-address";
  maxLength?: number;
  editable?: boolean;
  onFocus?: () => void;
  onPress?: () => void;
};

const OTP_LENGTH = 6;

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
  editable = true,
  onFocus,
  onPress,
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
            {...props}
          />
          <View className="absolute right-4">{icon}</View>
        </View>
      </Pressable>
      {helperText && (
        <Text className="mt-2 text-[13px] font-medium text-[#8A93A6]">
          {helperText}
        </Text>
      )}
    </View>
  );
}

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

export default function CorporateRegistrationScreen({
  onBack,
  onContinue,
  onOtpComplete,
  onDocumentsSubmit,
  step = 1,
  totalSteps = 5
}: CorporateRegistrationScreenProps) {
  const [corporateAccountNumber, setCorporateAccountNumber] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [bvn, setBvn] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [lastName, setLastName] = useState("");
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [showOtp, setShowOtp] = useState(false);
  const [currentStep, setCurrentStep] = useState(step);
  const [otpCode, setOtpCode] = useState("");
  const [resendSeconds, setResendSeconds] = useState(56);

  useEffect(() => {
    if (resendSeconds <= 0) return;

    const timer = setTimeout(() => setResendSeconds((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleContinue = () => {
    const corporateAccountValue = corporateAccountNumber.trim();
    const businessEmailValue = businessEmail.trim();
    const bvnValue = bvn.trim();
    const dobValue = dateOfBirth.trim();
    const lastNameValue = lastName.trim();

    // Validate each field individually and provide specific error messages
    if (corporateAccountValue.length < 10) {
      setErrorMessage("Corporate account number must be at least 10 digits");
      setShowError(true);
      return;
    }

    if (businessEmailValue.length === 0) {
      setErrorMessage("Business email is required");
      setShowError(true);
      return;
    }

    if (!validateEmail(businessEmailValue)) {
      setErrorMessage("Please enter a valid email address");
      setShowError(true);
      return;
    }

    if (bvnValue.length < 11) {
      setErrorMessage("BVN must be at least 11 digits");
      setShowError(true);
      return;
    }

    if (dobValue.length === 0) {
      setErrorMessage("Date of birth is required");
      setShowError(true);
      return;
    }

    if (lastNameValue.length === 0) {
      setErrorMessage("Last name is required");
      setShowError(true);
      return;
    }

    // All validations passed
    setShowError(false);
    setErrorMessage("");
    
    if (onDocumentsSubmit) {
      onDocumentsSubmit({ 
        corporateAccountNumber: corporateAccountValue, 
        businessEmail: businessEmailValue, 
        bvn: bvnValue, 
        dateOfBirth: dobValue, 
        lastName: lastNameValue 
      });
    } else {
      setCurrentStep(step + 1);
      setShowOtp(true);
    }
  };

  const isOtpComplete = otpCode.length === OTP_LENGTH;
  const resendLabel =
    resendSeconds > 0
      ? `Resend code in 00:${String(resendSeconds).padStart(2, "0")}`
      : "Resend code";

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F3F5F7]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
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
              Corporate details
            </Text>
            <Text className="mt-2 text-[15px] font-outfit text-[#8A93A6]">
              Enter your corporate account information exactly as it appears with the
              bank.
            </Text>

            <View className="mt-7 gap-6">
              <Field
                label="Corporate Account Number"
                placeholder="10-digit account number"
                value={corporateAccountNumber}
                onChangeText={(v) =>
                  setCorporateAccountNumber(v.replace(/[^0-9]/g, "").slice(0, 10))
                }
                keyboardType="number-pad"
                maxLength={10}
                icon={<Building2 size={20} color="#5C6478" />}
              />

              <Field
                label="Business Email"
                placeholder="yourname@company.com"
                value={businessEmail}
                onChangeText={setBusinessEmail}
                keyboardType="email-address"
                icon={<Mail size={20} color="#5C6478" />}
                helperText="We'll send verification codes to this email."
              />

              <Field
                label="BVN"
                placeholder="11-digit Bank Verification Number"
                value={bvn}
                onChangeText={(v) =>
                  setBvn(v.replace(/[^0-9]/g, "").slice(0, 11))
                }
                keyboardType="number-pad"
                maxLength={11}
                icon={<Hash size={20} color="#5C6478" />}
                helperText="We use this only to verify your identity."
              />

              <Field
                label="Date of Birth"
                placeholder="DD / MM / YYYY"
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                editable={false}
                onPress={() => {
                  Keyboard.dismiss();
                  setTempDate(dateOfBirth ? parseDate(dateOfBirth) : new Date());
                  setShowDatePicker(true);
                }}
                onFocus={() => {
                  Keyboard.dismiss();
                  setTempDate(dateOfBirth ? parseDate(dateOfBirth) : new Date());
                  setShowDatePicker(true);
                }}
                icon={<Calendar size={20} color="#5C6478" />}
              />

              <Field
                label="Last Name"
                placeholder="As shown on your ID"
                value={lastName}
                onChangeText={setLastName}
                icon={<User size={20} color="#5C6478" />}
              />
            </View>

            {showError && (
              <Text className="mt-4 text-sm font-outfit text-rose-500">
                {errorMessage}
              </Text>
            )}

            <View className="mt-10">
              <Pressable
                accessibilityRole="button"
                className="flex-row items-center justify-center rounded-2xl bg-[#123E7C] px-5 py-6 active:opacity-80"
                onPress={handleContinue}
              >
                <Text className="text-[18px] font-medium text-white">
                Continue
                </Text>
           
              </Pressable>
            </View>
          </>
        ) : (
          <Animated.View entering={SlideInLeft.duration(400).springify()}>
            <Text className="mt-7 text-[26px] font-outfit-semibold text-[#1B2D4A]">
              Enter code
            </Text>
            <Text className="mt-2 text-[15px] font-outfit text-[#67787F]">
              We sent a 6-digit code to {businessEmail}
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
              onPress={() => {
                setOtpCode("");
                setResendSeconds(56);
                // TODO: trigger the actual resend request here.
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
                  !isOtpComplete ? "opacity-60" : ""
                ].join(" ")}
                disabled={!isOtpComplete}
                onPress={() => {
                  if (isOtpComplete) {
                    if (onOtpComplete) {
                      onOtpComplete({ 
                        corporateAccountNumber, 
                        businessEmail, 
                        bvn, 
                        dateOfBirth, 
                        lastName 
                      });
                    } else {
                      onContinue({ 
                        corporateAccountNumber, 
                        businessEmail, 
                        bvn, 
                        dateOfBirth, 
                        lastName 
                      });
                    }
                  }
                }}
              >
                <Text className="text-[22px] font-outfit-semibold text-white">
                  Verify
                </Text>
                <Text className="ml-2 text-[28px] font-light text-white">
                  ›
                </Text>
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