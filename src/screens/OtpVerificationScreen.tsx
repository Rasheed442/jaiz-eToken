import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

type OtpVerificationScreenProps = {
  onBack: () => void;
};

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel="Go back"
      className="mb-8 h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-900"
      onPress={onPress}
    >
      <Text className="text-2xl leading-6 text-white">‹</Text>
    </Pressable>
  );
}

export default function OtpVerificationScreen({ onBack }: OtpVerificationScreenProps) {
  const [code, setCode] = useState('');
  const isComplete = code.length === 6;

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-10 pt-14"
        keyboardShouldPersistTaps="handled"
      >
        <BackButton onPress={onBack} />
        <Text className="text-3xl font-bold text-white">Verify your number</Text>
        <Text className="mt-3 text-base leading-6 text-slate-400">
          We sent a 6-digit code to your phone. Enter it below to finish setting up your account.
        </Text>

        <TextInput
          autoFocus
          className="mt-10 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-5 text-center text-3xl font-bold tracking-widest text-white"
          keyboardType="number-pad"
          maxLength={6}
          onChangeText={(value) => setCode(value.replace(/[^0-9]/g, ''))}
          placeholder="••••••"
          placeholderTextColor="#475569"
          textContentType="oneTimeCode"
          value={code}
        />
        <Text className="mt-4 text-center text-sm text-slate-500">Code expires in 09:42</Text>

        <View className="mt-8">
          <Pressable
            className={`items-center rounded-2xl bg-cyan-300 px-5 py-4 ${!isComplete ? 'opacity-50' : ''}`}
            disabled={!isComplete}
          >
            <Text className="text-base font-bold text-slate-950">Verify and finish</Text>
          </Pressable>
        </View>
        <Pressable className="mt-5 items-center" onPress={() => setCode('')}>
          <Text className="text-sm font-semibold text-cyan-300">Resend code</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
