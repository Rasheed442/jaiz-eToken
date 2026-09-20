import { ChevronLeft } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StatusBar, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Polyline } from 'react-native-svg';

/**
 * Submitted for review (Approver application status) screen.
 *
 * Styling: NativeWind v4 (Tailwind for React Native).
 * Deps:    nativewind, tailwindcss, react-native-safe-area-context,
 *          react-native-svg
 *
 * Font: the design uses Outfit. Map it in tailwind.config.js
 * (fontFamily sans / medium / semibold / bold) and load it with
 * @expo-google-fonts/outfit. Falls back to the system font until then.
 */

type Props = {
  /** When the application was submitted. Date or ISO-8601 string. */
  submittedAt: Date | string;
  /** Bank-issued reference for this application, e.g. "JEB-20260821-0417" */
  referenceId: string;
  /** Expected review time shown in the message. Defaults to "1–2 business days". */
  reviewWindow?: string;
  /** Status pill text. Defaults to "Pending Approval". */
  statusLabel?: string;
  /** Re-fetches the application status */
  onRefreshStatus?: () => void | Promise<void>;
  /** Leaves the screen without waiting for a decision */
  onDone?: () => void;
  /** Shows a spinner on the Refresh Status button and disables it */
  isRefreshing?: boolean;
  /** Called when user wants to go back */
  onBack?: () => void;
};

const COLORS = {
  pending: '#B9772A',
  white: '#FFFFFF',
};

/* ----------------------------- Helpers ----------------------------- */

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Formats a date as "21 Aug 2026" without relying on Intl availability. */
const formatSubmittedDate = (value: Date | string): string => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};

/* ----------------------------- Icon ----------------------------- */

const ClockIcon = ({ size = 30, color = COLORS.pending }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.8} />
    <Polyline
      points="12 6.5 12 12 15.5 14"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const BackButton = ({ onPress }: { onPress: () => void }) => (
  <Pressable
    accessibilityLabel="Go back"
    accessibilityRole="button"
    className="h-10 w-10 items-center justify-center rounded-xl bg-[#ecedee] active:opacity-70"
    onPress={onPress}
  >
    <ChevronLeft size={22} color="black" />
  </Pressable>
);

/* ----------------------------- Screen ----------------------------- */

export default function SubmittedForReviewScreen({
  submittedAt,
  referenceId,
  reviewWindow = '1–2 business days',
  statusLabel = 'Pending Approval',
  onRefreshStatus,
  onDone,
  isRefreshing = false,
  onBack,
}: Props) {
  const insets = useSafeAreaInsets();
  const submittedOn = formatSubmittedDate(submittedAt);

  return (
    <View
      className="flex-1 justify-between bg-[#F7F7F7] px-6"
      style={{ paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) }}
    >
      <StatusBar barStyle="dark-content" />

      {/* Header with back button */}
      <View className="flex-row items-center pt-6">
        {onBack && <BackButton onPress={onBack} />}
      </View>

      {/* Content */}
      <View className="items-center pt-28">
        <View className="mb-8 h-[72px] w-[72px] items-center justify-center rounded-full bg-[#FBEBCF]">
          <ClockIcon />
        </View>

        <Text
          accessibilityRole="header"
          className="mb-2.5 text-center text-[22px] font-bold leading-7 text-[#1A1A1A]"
        >
          Submitted for review
        </Text>

        <Text className="mb-6 px-4 text-center text-[14px] leading-5 text-[#6B7B80]">
          {submittedOn
            ? `Your application was submitted on ${submittedOn}. `
            : 'Your application has been submitted. '}
          The Bank typically reviews requests within {reviewWindow}.
        </Text>

        <View
          accessible
          accessibilityLabel={`Status: ${statusLabel}`}
          className="mb-6 rounded-full bg-[#FBEBCF] px-5 py-2.5"
        >
          <Text className="text-[14px] font-semibold text-[#B9772A]">
            {statusLabel}
          </Text>
        </View>

        <View className="w-full flex-row items-center justify-between rounded-2xl bg-[#F1F2F4] px-6 py-5">
          <Text className="text-[14px] text-[#6B7B80]">Reference ID</Text>
          <Text
            selectable
            accessibilityLabel={`Reference ID ${referenceId}`}
            className="ml-4 shrink text-[14px] font-semibold text-[#1A1A1A]"
          >
            {referenceId}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View className="items-center pb-10">
        <Pressable
          onPress={onRefreshStatus}
          disabled={isRefreshing}
          accessibilityRole="button"
          accessibilityLabel="Refresh Status"
          accessibilityState={{ disabled: isRefreshing, busy: isRefreshing }}
          className="h-[60px] w-full items-center justify-center rounded-[22px] bg-[#1F4380] shadow-sm shadow-black/10 active:opacity-90 disabled:opacity-60"
        >
          {isRefreshing ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text className="text-[16px] font-semibold text-white">
              Refresh Status
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={onDone}
          accessibilityRole="button"
          accessibilityLabel="Done for now"
          hitSlop={8}
          className="mt-4 px-6 py-2 active:opacity-60"
        >
          <Text className="text-[16px] font-medium text-[#6B7B80]">
            Done for now
          </Text>
        </Pressable>
      </View>
    </View>
  );
}