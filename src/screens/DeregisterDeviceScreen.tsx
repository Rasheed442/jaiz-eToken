import { ActivityIndicator, Pressable, StatusBar, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line, Path } from 'react-native-svg';


type Props = {
  onDeregister?: () => void;
  onCancel?: () => void;
  /** Disables both actions and shows a spinner on the primary button */
  isLoading?: boolean;
  errorMessage?: string;
};

const CONSEQUENCES = [
  'This device will no longer generate or display eToken codes.',
  'You will be logged out and must set up a passcode again on any device you use next.',
  'This action cannot be undone from this device — you will need to re-verify your identity to reactivate.',
];

/* ----------------------------- Icon ----------------------------- */

const WarningIcon = ({ size = 32, color = '#C23B40' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line x1={12} y1={9.5} x2={12} y2={13.5} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Line x1={12} y1={17} x2={12.01} y2={17} stroke={color} strokeWidth={2.2} strokeLinecap="round" />
  </Svg>
);

/* ----------------------------- Screen ----------------------------- */

export default function DeregisterDeviceScreen({
  onDeregister,
  onCancel,
  isLoading = false,
  errorMessage,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 justify-between bg-[#F7F7F7] px-6"
      style={{ paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) }}
    >
      <StatusBar barStyle="dark-content" />

      {/* Content */}
      <View className="items-center pt-24">
        <View className="mb-8 h-[80px] w-[80px] items-center justify-center rounded-full bg-[#FDECEC]">
          <WarningIcon />
        </View>

        <Text
          accessibilityRole="header"
          className="mb-2.5 text-center text-[22px] font-bold leading-7 text-[#1A1A1A]"
        >
          Deregister this device?
        </Text>

        <Text className="mb-7 px-3 text-center text-[14px] leading-5 text-[#6B7B80]">
          This device will lose access to your eToken. You will need to verify
          your identity again before you can generate codes on any device.
        </Text>

        <View className="w-full gap-3 rounded-[20px] bg-white px-2 py-8">
          {CONSEQUENCES.map((text) => (
            <View key={text} className="flex-row items-center">
              <View className="mr-3 h-1.5 w-1.5 rounded-full bg-[#1F4380]" />
              <Text className="flex-1 text-[13px] font-normal leading-4 text-[#4A4A4A]">
                {text}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Actions */}
      <View className="items-center pb-6">
        {errorMessage ? (
          <Text className="mb-4 text-center text-[14px] font-medium text-[#C23B40]">
            {errorMessage}
          </Text>
        ) : null}
        <Pressable
          onPress={onDeregister}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Deregister Device"
          accessibilityState={{ disabled: isLoading, busy: isLoading }}
          className="h-[60px] w-full flex-row items-center justify-center rounded-[22px] bg-[#C23B40] shadow-sm shadow-black/10 active:opacity-90 disabled:opacity-60"
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-[16px] font-semibold text-white">
              Deregister Device
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={onCancel}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          hitSlop={8}
          className="mt-4 px-6 py-2 active:opacity-60 disabled:opacity-40"
        >
          <Text className="text-[16px] font-medium text-[#6B7B80]">Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}
