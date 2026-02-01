const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude React Native Firebase modules to force web Firebase usage
config.resolver.alias = {
  ...config.resolver.alias,
  // Ensure we don't load React Native Firebase modules
  'firebase/auth': require.resolve('firebase/auth'),
  'firebase/app': require.resolve('firebase/app'),
  'firebase/firestore': require.resolve('firebase/firestore'),
};

// Exclude React Native Firebase from module resolution
config.resolver.blockList = [
  /node_modules\/@react-native-firebase\/.*/,
];

// Add support for web-specific extensions
config.resolver.assetExts.push(
  // Add any additional asset extensions if needed
);

module.exports = config;
