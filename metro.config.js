const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const { resolveRequest } = config.resolver;

// Firebase compatibility fixes for Expo SDK 53+
if (!config.resolver.sourceExts.includes('cjs')) {
  config.resolver.sourceExts.push('cjs');
}
config.resolver.unstable_enablePackageExports = false;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'firebase/auth') {
    return context.resolveRequest(context, 'firebase/auth/react-native', platform);
  }

  if (resolveRequest) {
    return resolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
