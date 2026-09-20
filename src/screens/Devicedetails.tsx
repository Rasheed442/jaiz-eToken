import { ArrowRight, ChevronLeft, Smartphone, Trash2 } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
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
  deviceModel = "iPhone 14 Pro",
  location = "Lagos, Nigeria",
  registeredOn = "21 Aug 2026",
  lastUsed = "Today, 9:41 AM",
  isActive = true
}: DeviceDetailsScreenProps) {

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

        {/* Hero device card */}
        <View className="mt-7 items-center rounded-3xl bg-white px-6 py-8">
          <View className="h-[88px] w-[88px] items-center justify-center rounded-full bg-[#E8EEFB]">
            <Smartphone size={34} color="#123E7C" />
          </View>

          <Text className="mt-5 text-[20px] font-outfit-semibold text-[#1B2D4A]">
            {deviceModel}
          </Text>

          <View
            className={`mt-4 flex-row items-center gap-2 rounded-full px-4 py-2 ${
              isActive ? "bg-[#E7F7EE]" : "bg-[#FDECEC]"
            }`}
          >
            <View
              className={`h-2 w-2 rounded-full ${
                isActive ? "bg-[#16A34A]" : "bg-[#D32F2F]"
              }`}
            />
            <Text
              className={`text-[15px] font-outfit-semibold ${
                isActive ? "text-[#16A34A]" : "text-[#D32F2F]"
              }`}
            >
              {isActive ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>

        {/* Details list */}
        <View className="mt-5 rounded-3xl bg-white px-5 py-1">
          <DetailRow label="Model" value={deviceModel} />
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