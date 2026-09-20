import { Image } from 'expo-image';
import {
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
} from "react-native-reanimated";
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Polyline, Rect } from 'react-native-svg';
import { images } from '../../constant';

type Props = {
  /** Device the token is now active on, e.g. "iPhone 14 Pro" */
  newDeviceName?: string;
  /** Device the token was deactivated on, e.g. "iPhone 12 — Lagos" */
  previousDeviceName?: string;
  /** Label under "This device" after the device name, e.g. "Registered just now" */
  registeredLabel?: string;
  onContinue?: () => void;
};

const colors = {
  background: '#F7F7F7',
  surface: '#FFFFFF',
  title: '#1A1A1A',
  body: '#6B7280',
  caption: '#6B7280',
  successBg: '#E3F3EA',
  success: '#2E9E6B',
  deviceIconBg: '#E8EEFB',
  primary: '#1F4380',
  onPrimary: '#FFFFFF',
};

const fonts = {
  regular: undefined as string | undefined, // 'Outfit_400Regular'
  medium: undefined as string | undefined, // 'Outfit_500Medium'
  bold: undefined as string | undefined, // 'Outfit_700Bold'
};

/* ----------------------------- Icons ----------------------------- */

const CheckCircleIcon = ({ size = 28, color = colors.success }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.8} />
    <Polyline
      points="8 12.5 11 15.5 16 9"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PhoneIcon = ({ size = 18, color = colors.primary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x={6}
      y={2}
      width={12}
      height={20}
      rx={2.5}
      stroke={color}
      strokeWidth={1.8}
    />
    <Line
      x1={12}
      y1={18}
      x2={12.01}
      y2={18}
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
    />
  </Svg>
);

const ArrowRightIcon = ({ size = 20, color = colors.onPrimary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line
      x1={5}
      y1={12}
      x2={19}
      y2={12}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
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

export default function DeviceRegisteredScreen({
  newDeviceName = 'iPhone 14 Pro',
  previousDeviceName = 'iPhone 12 — Lagos',
  registeredLabel = 'Registered just now',
  onContinue,
}: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.container}>
        <View style={styles.content}>
          <Animated.View entering={FadeIn.duration(400).delay(300)} >
            <Image source={images.check} style={{ width: 80, height: 80 }} />
          </Animated.View>

          <Text style={styles.title} accessibilityRole="header">
            Device registered
          </Text>

          <Text style={styles.message}>
            Your eToken is now active on {newDeviceName}. It has been
            deactivated on {previousDeviceName} for your security.
          </Text>

          <View style={styles.deviceCard}>
            <View style={styles.deviceIconWrap}>
              <PhoneIcon />
            </View>
            <View style={styles.deviceText}>
              <Text style={styles.deviceLabel}>This device</Text>
              <Text style={styles.deviceMeta}>
                {newDeviceName} • {registeredLabel}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Pressable
            onPress={onContinue}
            accessibilityRole="button"
            accessibilityLabel="Go to Token Home"
            className="flex-row items-center justify-center py-6 gap-2 rounded-[28px] bg-[#123E7C] px-5 py-3 active:opacity-80"
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>Go to Token Home</Text>
            <ArrowRightIcon />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ----------------------------- Styles ----------------------------- */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 26,
    paddingBottom: 24,
    justifyContent: 'space-between',
    backgroundColor: colors.background,
  },
  content: {
    alignItems: 'center',
    paddingTop: 48,
    flex: 1,
  },
  buttonContainer: {
    paddingBottom: 24,
  },

  successBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },

  title: {
    fontFamily: fonts.bold,
    fontWeight: '700',
    fontSize: 22,
    lineHeight: 28,
    color: "#202121",
    textAlign: 'center',
    paddingTop:20,
    marginBottom: 10,
  },
  message: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.body,
    textAlign: 'center',
    paddingHorizontal: 8,
    marginBottom: 28,
  },

  deviceCard: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 1 },
    }),
  },
  deviceIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.deviceIconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deviceText: {
    flex: 1,
  },
  deviceLabel: {
    fontFamily: fonts.medium,
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 18,
    color: colors.title,
  },
  deviceMeta: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 15,
    color: colors.caption,
    marginTop: 2,
  },

  button: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  buttonText: {
    fontFamily: fonts.medium,
    fontWeight: '600',
    fontSize: 16,
    color: colors.onPrimary,
  },
});