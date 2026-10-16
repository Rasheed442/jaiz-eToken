const { withAppBuildGradle } = require("expo/config-plugins");

// Pins the MetaMap Android SDK to the version used by the working Jaiz app.
// react-native-metamap-sdk@5.4.44 pulls com.metamap:android-sdk:3.42.21, which
// brings CameraX 1.6.0 and leaves the selfie camera preview blank on Android.
// 3.42.15 (CameraX 1.5.x) exposes the same startFlow API used by the RN module.
const METAMAP_ANDROID_SDK_VERSION = "3.42.15";
const MARKER = "// @generated metamap-android-sdk-pin";

const block = `
${MARKER}
configurations.all {
    resolutionStrategy {
        force "com.metamap:android-sdk:${METAMAP_ANDROID_SDK_VERSION}"
    }
}
`;

module.exports = function withMetaMapAndroidSdkPin(config) {
  return withAppBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes(MARKER)) {
      config.modResults.contents += block;
    }
    return config;
  });
};
