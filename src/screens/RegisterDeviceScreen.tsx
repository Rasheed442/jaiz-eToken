import { AlertTriangle, ArrowRight, Camera, Check, ChevronLeft, Mail } from 'lucide-react-native'
import React, { useRef, useState } from 'react'
import * as Application from 'expo-application'
import * as Device from 'expo-device'
import {
  ActivityIndicator,
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { registrationApi } from '@/lib/api'
import { authStorage } from '@/lib/auth/storage'

type RegisterDeviceScreenProps = {
  onBack: () => void;
  onRegisterComplete: () => void;
}

type VerifyMethod = 'otp' | 'liveness'

interface VerifyOption {
  id: VerifyMethod
  icon: typeof Mail
  title: string
  subtitle: string
}

const OPTIONS: VerifyOption[] = [
  {
    id: 'otp',
    icon: Mail,
    title: 'Send OTP to registered number',
    subtitle: '+234 801 •••• 45',
  },
  {
    id: 'liveness',
    icon: Camera,
    title: 'Verify with liveness check',
    subtitle: 'Use your face to confirm your identity',
  },
]

const COLORS = {
  bg: '#F7F7F8',
  text: '#111114',
  subtext: '#6B7280',
  border: '#E5E7EB',
  danger: '#EF4444',
  dangerBg: '#FEF2F2',
  dangerText: '#DC2626',
  primary: '#1E3A8A',
  primaryPressed: '#182F70',
  selectedBg: '#EEF2FF',
  white: '#FFFFFF',
}

function VerifyOptionRow({
  option,
  selected,
  onPress,
}: {
  option: VerifyOption
  selected: boolean
  onPress: () => void
}) {
  const scale = useRef(new Animated.Value(1)).current
  const checkScale = useRef(new Animated.Value(selected ? 1 : 0)).current
  const Icon = option.icon

  React.useEffect(() => {
    Animated.spring(checkScale, {
      toValue: selected ? 1 : 0,
      useNativeDriver: true,
      friction: 6,
      tension: 120,
    }).start()
  }, [selected])

  function handlePressIn() {
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, friction: 8 }).start()
  }
  function handlePressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 8 }).start()
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="radio"
        accessibilityState={{ checked: selected }}
        style={[
          styles.optionRow,
          selected ? styles.optionRowSelected : styles.optionRowDefault,
        ]}
      >
        <View style={styles.optionIconWrap}>
          <Icon size={20} color={COLORS.primary} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.optionTitle}>{option.title}</Text>
          <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
        </View>

        <View
          style={[
            styles.radioOuter,
            selected ? { borderColor: COLORS.primary, backgroundColor: COLORS.primary } : null,
          ]}
        >
          <Animated.View style={{ transform: [{ scale: checkScale }] }}>
            <Check size={13} color={COLORS.white} strokeWidth={3} />
          </Animated.View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

export default function RegisterDeviceScreen({ onBack, onRegisterComplete }: RegisterDeviceScreenProps) {
  const [selected, setSelected] = useState<VerifyMethod>('otp')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const buttonScale = useRef(new Animated.Value(1)).current

  async function handleRegister() {
    if (submitting) return
    setSubmitting(true)
    setError('')

    try {
      const accountNumber = await authStorage.getAccountNumber()
      let deviceId = ''
      if (Platform.OS === 'android') {
        deviceId = Application.getAndroidId() || ''
      } else if (Platform.OS === 'ios') {
        deviceId = (await Application.getIosIdForVendorAsync()) || ''
      }
      deviceId = deviceId || (await authStorage.getDeviceId()) || ''

      if (!accountNumber || !deviceId) {
        throw new Error('Required account or device details are missing. Please log in again.')
      }

      const payload = {
        accountNumber,
        deviceId,
        deviceFingerprint: `sha256_${deviceId}`,
        deviceModel: Device.modelName || Device.deviceName || '',
        osVersion: `${Platform.OS} ${Device.osVersion || ''}`.trim(),
        appVersion: Application.nativeApplicationVersion || '2.1.0',
        enableBiometric: await authStorage.getBiometricEnabled()
      }

      const response = await registrationApi.registerDevice(payload)
      if (!response.success) {
        setError(response.message || 'Could not register this device. Please try again.')
        return
      }

      onRegisterComplete()
    } catch (registrationError: any) {
      setError(registrationError?.message || 'Could not register this device. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function pressIn() {
    Animated.spring(buttonScale, { toValue: 0.97, useNativeDriver: true, friction: 8 }).start()
  }
  function pressOut() {
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, friction: 8 }).start()
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Back */}
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.8}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={22} color={COLORS.text} />
        </TouchableOpacity>

        {/* Heading */}
        <View style={{ marginTop: 24 }}>
          <Text style={styles.title}>Register this device</Text>
          <Text style={styles.subtitle}>
            Verify your identity to link your eToken to this device.
          </Text>
        </View>

        {/* Warning */}
        <View style={styles.warningBox}>
          <AlertTriangle size={20} color={COLORS.danger} style={{ marginTop: 2 }} />
          <Text style={styles.warningText}>
            Only one device can be active at a time. Registering this device will deactivate your
            eToken on iPhone 12 — Lagos.
          </Text>
        </View>

        {/* Options */}
        <View style={{ marginTop: 20, gap: 12 }}>
          {OPTIONS.map((opt) => (
            <VerifyOptionRow
              key={opt.id}
              option={opt}
              selected={selected === opt.id}
              onPress={() => setSelected(opt.id)}
            />
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Bottom actions */}
        <View style={styles.bottomArea}>
          <Animated.View style={{ transform: [{ scale: buttonScale }], width: '100%' }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleRegister}
              onPressIn={pressIn}
              onPressOut={pressOut}
              disabled={submitting}
              style={[styles.registerButton, submitting && { opacity: 0.75 }]}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <View style={styles.registerButtonContent}>
                  <Text style={styles.registerButtonText}>Register New Device</Text>
                  <ArrowRight size={18} color={COLORS.white} />
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            style={{ marginTop: 16 }}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  backButton: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 32,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 21,
    color: COLORS.subtext,
  },
  warningBox: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: COLORS.dangerBg,
    borderRadius: 16,
    padding: 16,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.dangerText,
    fontWeight: '500',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 16,
  },
  optionRowDefault: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  optionRowSelected: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.selectedBg,
  },
  optionIconWrap: {
    height: 44,
    width: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
      },
      android: { elevation: 2 },
    }),
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  optionSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: COLORS.subtext,
  },
  radioOuter: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomArea: {
    alignItems: 'center',
    paddingBottom: 16,
    paddingTop: 12,
  },
  registerButton: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    paddingVertical: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  registerButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.subtext,
  },
  errorText: {
    marginTop: 16,
    color: COLORS.dangerText,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
})
