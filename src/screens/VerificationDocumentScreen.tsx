import * as DocumentPicker from 'expo-document-picker';
import { ChevronLeft } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StatusBar,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path, Polyline } from 'react-native-svg';

/**
 * Verification documents screen (Approver onboarding).
 *
 * Shows the captured-selfie status and lets the user attach a signed Board
 * Resolution (PDF / JPG / PNG, max 10MB) before submitting for approval.
 *
 * Styling: NativeWind v4 (Tailwind for React Native).
 * Deps:    nativewind, tailwindcss, react-native-safe-area-context,
 *          react-native-svg, expo-document-picker
 *
 * Font: the design uses Outfit. Map it in tailwind.config.js
 * (fontFamily sans / medium / semibold / bold) and load it with
 * @expo-google-fonts/outfit. Falls back to the system font until then.
 */

/* ----------------------------- Types & config ----------------------------- */

export type SelectedDocument = {
  uri: string;
  name: string;
  mimeType: string;
  /** Size in bytes, when the platform reports it */
  size?: number;
};

type Props = {
  /** Called with the chosen Board Resolution when the user taps Submit */
  onSubmit?: (document: SelectedDocument) => void | Promise<void>;
  /** Controls the loading state of the Submit button (e.g. while uploading) */
  isSubmitting?: boolean;
  /** Called when user wants to go back */
  onBack?: () => void;
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

const COLORS = {
  success: '#2E9E6B',
  primary: '#1F4380',
  white: '#FFFFFF',
  muted: '#6B7B80',
};

/* ----------------------------- Helpers ----------------------------- */

const formatFileSize = (bytes?: number): string => {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const validateDocument = (
  asset: DocumentPicker.DocumentPickerAsset,
): string | null => {
  if (!asset.mimeType || !ALLOWED_MIME_TYPES.includes(asset.mimeType)) {
    return 'Unsupported file type. Please upload a PDF, JPG or PNG.';
  }
  if (asset.size != null && asset.size > MAX_FILE_SIZE_BYTES) {
    return 'This file is larger than 10MB. Please choose a smaller file.';
  }
  return null;
};

/* ----------------------------- Icons ----------------------------- */

type IconProps = { size?: number; color?: string };

const CheckCircleIcon = ({ size = 26, color = COLORS.success }: IconProps) => (
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

const CheckIcon = ({ size = 22, color = COLORS.success }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline
      points="20 6 9 17 4 12"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const UploadIcon = ({ size = 24, color = COLORS.primary }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Polyline
      points="17 8 12 3 7 8"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line x1={12} y1={3} x2={12} y2={15} stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const FileIcon = ({ size = 22, color = COLORS.primary }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Polyline
      points="13 2 13 9 20 9"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CloseIcon = ({ size = 18, color = COLORS.muted }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1={18} y1={6} x2={6} y2={18} stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1={6} y1={6} x2={18} y2={18} stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const ArrowRightIcon = ({ size = 20, color = COLORS.white }: IconProps) => (
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

/* ----------------------------- Sections ----------------------------- */

const SelfieCapturedCard = () => (
  <View
    accessible
    accessibilityLabel="Selfie captured. Taken during liveness check."
    className="flex-row items-center rounded-[20px] bg-[#E4F2E8] px-5 py-4"
  >
    <View className="h-[52px] w-[52px] items-center justify-center rounded-full bg-white">
      <CheckCircleIcon />
    </View>
    <View className="ml-4 flex-1">
      <Text className="text-[15px] font-medium leading-5 text-[#1A1A1A]">
        Selfie captured
      </Text>
      <Text className="mt-0.5 text-[13px] leading-[18px] text-[#6B7B80]">
        Taken during liveness check
      </Text>
    </View>
    <CheckIcon />
  </View>
);

type DropzoneProps = {
  onBrowse: () => void;
  isPicking: boolean;
  hasError: boolean;
};

const UploadDropzone = ({ onBrowse, isPicking, hasError }: DropzoneProps) => (
  <View
    className={`items-center rounded-3xl border border-dashed bg-white px-6 py-8 ${
      hasError ? 'border-[#C23B40]' : 'border-[#D9DCE0]'
    }`}
  >
    <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-[#EEF0F3]">
      <UploadIcon />
    </View>

    <Text className="mb-1.5 text-[16px] font-medium leading-6 text-[#1A1A1A]">
      Upload Board Resolution
    </Text>
    <Text className="mb-5 max-w-[260px] text-center text-[13px] leading-5 text-[#6B7B80]">
      PDF, JPG or PNG — max 10MB. Must be signed by two directors.
    </Text>

    <Pressable
      onPress={onBrowse}
      disabled={isPicking}
      accessibilityRole="button"
      accessibilityLabel="Browse files"
      accessibilityState={{ disabled: isPicking, busy: isPicking }}
      className="min-h-[44px] min-w-[128px] items-center justify-center rounded-2xl bg-[#EEF0F3] px-6 py-3 active:opacity-70 disabled:opacity-60"
    >
      {isPicking ? (
        <ActivityIndicator color={COLORS.primary} />
      ) : (
        <Text className="text-[15px] font-semibold text-[#1F4380]">
          Browse files
        </Text>
      )}
    </Pressable>
  </View>
);

type SelectedFileCardProps = {
  document: SelectedDocument;
  onRemove: () => void;
  disabled?: boolean;
};

const SelectedFileCard = ({ document, onRemove, disabled }: SelectedFileCardProps) => {
  const size = formatFileSize(document.size);
  return (
    <View className="flex-row items-center rounded-3xl border border-[#E4E6EA] bg-white px-4 py-4">
      <View className="h-11 w-11 items-center justify-center rounded-full bg-[#EEF0F3]">
        <FileIcon />
      </View>
      <View className="mx-3 flex-1">
        <Text
          numberOfLines={1}
          ellipsizeMode="middle"
          className="text-[15px] font-medium leading-5 text-[#1A1A1A]"
        >
          {document.name}
        </Text>
        <Text className="mt-0.5 text-[13px] leading-[18px] text-[#6B7B80]">
          Board Resolution{size ? ` • ${size}` : ''}
        </Text>
      </View>
      <Pressable
        onPress={onRemove}
        disabled={disabled}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${document.name}`}
        className="h-9 w-9 items-center justify-center rounded-full bg-[#F1F2F4] active:opacity-70 disabled:opacity-40"
      >
        <CloseIcon />
      </Pressable>
    </View>
  );
};

/* ----------------------------- Screen ----------------------------- */

export default function VerificationDocumentScreen({
  onSubmit,
  isSubmitting = false,
  onBack,
}: Props) {
  const insets = useSafeAreaInsets();
  const [document, setDocument] = useState<SelectedDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);

  const handleBrowse = useCallback(async () => {
    setError(null);
    setIsPicking(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ALLOWED_MIME_TYPES,
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const validationError = validateDocument(asset);
      if (validationError) {
        setDocument(null);
        setError(validationError);
        return;
      }

      setDocument({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType as string,
        size: asset.size,
      });
    } catch {
      setError('We couldn’t open your files. Please try again.');
    } finally {
      setIsPicking(false);
    }
  }, []);

  const handleRemove = useCallback(() => {
    setDocument(null);
    setError(null);
  }, []);

  const handleSubmit = useCallback(() => {
    if (document) void onSubmit?.(document);
  }, [document, onSubmit]);

  const canSubmit = document !== null && !isSubmitting;

  return (
    <View
      className="flex-1 bg-[#F7F7F7]"
      style={{ paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) }}
    >
      <StatusBar barStyle="dark-content" />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-6 pb-6"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center pt-6">
          {onBack && <BackButton onPress={onBack} />}
        </View>

        <Text
          accessibilityRole="header"
          className="mb-2 mt-4 text-[24px] font-medium leading-8 text-[#1A1A1A]"
        >
          Verification documents
        </Text>
        <Text className="mb-6 text-[14px] leading-5 text-[#6B7B80]">
          We need a selfie and your Board Resolution to confirm you as Approver.
        </Text>

        <View className="gap-4">
          <SelfieCapturedCard />

          {document ? (
            <SelectedFileCard
              document={document}
              onRemove={handleRemove}
              disabled={isSubmitting}
            />
          ) : (
            <UploadDropzone
              onBrowse={handleBrowse}
              isPicking={isPicking}
              hasError={error !== null}
            />
          )}

          {error ? (
            <Text
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
              className="-mt-1 px-1 text-[13px] leading-5 text-[#C23B40]"
            >
              {error}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      {/* Primary action */}
      <View className="px-5 pb-6 pt-2">
        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityLabel="Submit for Approval"
          accessibilityState={{ disabled: !canSubmit, busy: isSubmitting }}
          className="h-[60px] w-full flex-row items-center justify-center gap-2 rounded-[22px] bg-[#1F4380] shadow-sm shadow-black/10 active:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text className="text-[16px] font-semibold text-white">
                Submit for Approval
              </Text>
              <ArrowRightIcon />
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}