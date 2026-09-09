import { Image } from "expo-image";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { images } from "../../constant";

type WelcomeScreenProps = {
  onContinue: () => void;
};

export default function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  return (
    <View className="flex-1 bg-[#193F7F]">
      <SafeAreaView>
        <View className="">
          <Image
            accessibilityLabel="Jaiz Token"
            className=""
            resizeMode="contain"
            source={images.logo}
            height={100}
            width={100}
          />
        </View>
        {/* <Text>Outfit</Text> */}
      </SafeAreaView>
    </View>
  );
}
