const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Firebase compatibility for Expo SDK 53+ (firebase@12 handles the dual-package hazard)
if (!config.resolver.sourceExts.includes("cjs")) {
  config.resolver.sourceExts.push("cjs");
}

// Use the compiled CommonJS entry for react-native-svg on every platform.
config.resolver.alias = {
  ...config.resolver.alias,
  "react-native-svg": "react-native-svg/lib/commonjs",
};

module.exports = config;
