import { authStorage } from "@/lib/auth/storage";
import * as Application from "expo-application";
import * as Device from "expo-device";
import {
  ArrowRight,
  ChevronLeft,
  Smartphone,
  Trash2
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type DeviceDetailsScreenProps = {
  onBack: () => void;
  onRegisterNewDevice: () => void;
  onDeregisterDevice: () => void;
  deviceModel?: string;
  location?: string;
  registeredOn?: string;
  lastUsed?: string;
  isActive?: boolean;
};

type StoredDeviceDetails = {
  deviceModel: string;
  deviceId: string;
  isActive: boolean;
};

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel="Go back"
      accessibilityRole="button"
      className="h-10 w-10 items-center justify-center rounded-xl bg-[#ECEDEE] active:opacity-70"
      onPress={onPress}
    >
      <ChevronLeft size={22} color="black" />
    </Pressable>
  );
}

function DetailRow({
  label,
  value,
  isLast
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center justify-between py-4 ${
        isLast ? "" : "border-b border-[#EFF1F3]"
      }`}
    >
      <Text className="text-[15px] font-outfit text-[#67787F]">{label}</Text>
      <Text className="text-[15px] font-outfit-semibold text-[#1B2D4A]">
        {value}
      </Text>
    </View>
  );
}

export default function DeviceDetailsScreen({
  onBack,
  onRegisterNewDevice,
  onDeregisterDevice,
  deviceModel,
  location = "-----",
  registeredOn = "----",
  lastUsed = "------",
  isActive
}: DeviceDetailsScreenProps) {
  const [storedDetails, setStoredDetails] =
    useState<StoredDeviceDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadDeviceDetails = async () => {
      try {
        const [deviceId, accessToken] = await Promise.all([
          authStorage.getDeviceId(),
          authStorage.getAccessToken()
        ]);

        if (isMounted) {
          setStoredDetails({
            deviceModel:
              Device.modelName || Application.applicationName || "This device",
            deviceId: deviceId || "Unavailable",
            isActive: Boolean(accessToken && deviceId)
          });
        }
      } catch (error) {
        console.error("Unable to load device details:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDeviceDetails();
    return () => {
      isMounted = false;
    };
  }, []);

  const displayedModel =
    deviceModel || storedDetails?.deviceModel || "This device";
  const displayedActive = isActive ?? storedDetails?.isActive ?? false;
  const fullDeviceId = storedDetails?.deviceId || "Unavailable";
  const displayedDeviceId =
    fullDeviceId.length > 16
      ? `${fullDeviceId.slice(0, 8)}…${fullDeviceId.slice(-4)}`
      : fullDeviceId;

  return (
    <SafeAreaView className="flex-1 bg-[#F3F5F7]">
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-10">
        <View className="pt-6">
          <BackButton onPress={onBack} />
        </View>

        <Text className="mt-7 text-[26px] font-outfit-semibold text-[#1B2D4A]">
          Device Details
        </Text>
        <Text className="mt-2 text-[15px] font-outfit text-[#67787F]">
          Manage the device linked to your eToken.
        </Text>

        {loading && (
          <View className="mt-5 flex-row items-center gap-2">
            <ActivityIndicator size="small" color="#123E7C" />
            <Text className="text-[14px] font-outfit text-[#67787F]">
              Loading device details…
            </Text>
          </View>
        )}

        {/* Hero device card */}
        <View className="mt-7 items-center rounded-3xl bg-white px-6 py-8">
          <View className="h-[88px] w-[88px] items-center justify-center rounded-full bg-[#E8EEFB]">
            <Smartphone size={34} color="#123E7C" />
          </View>

          <Text className="mt-5 text-[20px] font-outfit-semibold text-[#1B2D4A]">
            {displayedModel}
          </Text>

          <View
            className={`mt-4 flex-row items-center gap-2 rounded-full px-4 py-2 ${
              displayedActive ? "bg-[#E7F7EE]" : "bg-[#FDECEC]"
            }`}
          >
            <View
              className={`h-2 w-2 rounded-full ${
                displayedActive ? "bg-[#16A34A]" : "bg-[#D32F2F]"
              }`}
            />
            <Text
              className={`text-[15px] font-outfit-semibold ${
                displayedActive ? "text-[#16A34A]" : "text-[#D32F2F]"
              }`}
            >
              {displayedActive ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>

        {/* Details list */}
        <View className="mt-5 rounded-3xl bg-white px-5 py-1">
          <DetailRow label="Model" value={displayedModel} />
          <DetailRow label="Device ID" value={displayedDeviceId} />
          <DetailRow label="Location" value={location} />
          <DetailRow label="Registered on" value={registeredOn} />
          <DetailRow label="Last used" value={lastUsed} isLast />
        </View>

        {/* Actions */}
        <Pressable
          accessibilityRole="button"
          onPress={onRegisterNewDevice}
          className="mt-8 flex-row items-center justify-center gap-3 rounded-2xl border-[1.5px] border-[#123E7C] px-5 py-5 active:opacity-70"
        >
          <Text className="text-[17px] font-outfit-semibold text-[#123E7C]">
            Register a New Device
          </Text>
          <ArrowRight size={20} color="#123E7C" />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={onDeregisterDevice}
          className="mt-3 flex-row items-center justify-center gap-3 rounded-2xl border-[1.5px] border-[#E57373] px-5 py-5 active:opacity-70"
        >
          <Text className="text-[17px] font-outfit-semibold text-[#D32F2F]">
            Deregister This Device
          </Text>
          <Trash2 size={20} color="#D32F2F" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
