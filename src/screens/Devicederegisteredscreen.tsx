import { Pressable, StatusBar, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line, Polyline, Rect } from 'react-native-svg';

/**
 * Device deregistered (eToken) screen.
 * Styled with NativeWind v4 (Tailwind for React Native).
 *
 * Deps: nativewind, tailwindcss, react-native-safe-area-context, react-native-svg
 *
 * Font: same as the other eToken screens. The design uses Outfit; map it in
 * tailwind.config.js (fontFamily sans / medium / semibold / bold) and load it
 * with @expo-google-fonts/outfit. Falls back to the system font until then.
 */

type Props = {
  /** Starts the flow to register a new device (or reactivate this one) */
  onRegisterNewDevice?: () => void;
  /** Dismisses the screen */
  onDone?: () => void;
};

/* ----------------------------- Icons ----------------------------- */

// Feather-style "smartphone" with a diagonal strike-through
const PhoneOffIcon = ({ size = 30, color = '#6B7B80' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={5} y={2} width={14} height={20} rx={2.5} stroke={color} strokeWidth={1.8} />
    <Line x1={4} y1={3} x2={20} y2={21} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const ArrowRightIcon = ({ size = 20, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1={5} y1={12} x2={19} y2={12} stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Polyline
      points="12 5 19 12 12 19"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/* ----------------------------- Screen ----------------------------- */

export default function DeviceDeregisteredScreen({
  onRegisterNewDevice,
  onDone,
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
        <View className="mb-8 h-[72px] w-[72px] items-center justify-center rounded-full bg-[#EEF0F3]">
          <PhoneOffIcon />
        </View>

        <Text
          accessibilityRole="header"
          className="mb-2.5 text-center text-[22px] font-bold leading-7 text-[#1A1A1A]"
        >
          Device deregistered
        </Text>

        <Text className="px-4 text-center text-[14px] leading-5 text-[#6B7B80]">
          This device no longer has access to your eToken. To use eToken again,
          register a new device or reactivate this one.
        </Text>
      </View>

      {/* Actions */}
      <View className="items-center pb-10">
        <Pressable
          onPress={onRegisterNewDevice}
          accessibilityRole="button"
          accessibilityLabel="Register a New Device"
          className="h-[60px] w-full flex-row items-center justify-center gap-2 rounded-[22px] bg-[#1F4380] shadow-sm shadow-black/10 active:opacity-90"
        >
          <Text className="text-[16px] font-semibold text-white">
            Register a New Device
          </Text>
          <ArrowRightIcon />
        </Pressable>

        <Pressable
          onPress={onDone}
          accessibilityRole="button"
          accessibilityLabel="Done"
          hitSlop={8}
          className="mt-4 px-6 py-2 active:opacity-60"
        >
          <Text className="text-[16px] font-medium text-[#6B7B80]">Done</Text>
        </Pressable>
      </View>
    </View>
  );
}