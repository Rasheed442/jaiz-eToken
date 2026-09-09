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

type PersonalRegistrationScreenProps = {
  onBack: () => void;
  onContinue: () => void;
};

type FieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences';
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

function Field({ label, placeholder, value, onChangeText, ...props }: FieldProps) {
  return (
    <View>
      <Text className="mb-2 text-sm font-semibold text-slate-200">{label}</Text>
      <TextInput
        className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-4 text-base text-white"
        placeholder={placeholder}
        placeholderTextColor="#64748b"
        value={value}
        onChangeText={onChangeText}
        {...props}
      />
    </View>
  );
}

export default function PersonalRegistrationScreen({
  onBack,
  onContinue,
}: PersonalRegistrationScreenProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [showError, setShowError] = useState(false);

  const handleContinue = () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setShowError(true);
      return;
    }
    onContinue();
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pb-10 pt-14"
        keyboardShouldPersistTaps="handled"
      >
        <BackButton onPress={onBack} />
        <Text className="text-3xl font-bold text-white">Tell us about you</Text>
        <Text className="mt-3 text-base leading-6 text-slate-400">
          A few details to make your experience feel personal.
        </Text>

        <View className="mt-9 gap-5">
          <Field label="Full name" value={name} onChangeText={setName} placeholder="Alex Johnson" />
          <Field
            label="Email address"
            value={email}
            onChangeText={setEmail}
            placeholder="alex@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Phone number"
            value={phone}
            onChangeText={setPhone}
            placeholder="(555) 123-4567"
            keyboardType="phone-pad"
          />
        </View>

        {showError && (
          <Text className="mt-4 text-sm text-rose-300">Please complete all fields to continue.</Text>
        )}
        <View className="mt-8">
          <Pressable className="items-center rounded-2xl bg-cyan-300 px-5 py-4" onPress={handleContinue}>
            <Text className="text-base font-bold text-slate-950">Continue</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
