const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Firebase compatibility for Expo SDK 53+ (firebase@12 handles the dual-package hazard)
if (!config.resolver.sourceExts.includes('cjs')) {
  config.resolver.sourceExts.push('cjs');
}
config.resolver.unstable_enablePackageExports = false;

// react-native-svg's package.json "react-native" field points at its raw
// TypeScript source (src/index.ts) rather than the compiled lib/ output.
// That field is normally only meant to win over "main" on native platforms,
// but with package exports disabled above, Metro applies the same field
// order to every platform (including web) - so web bundles were pulling in
// unbuilt source whose relative imports don't line up with node_modules'
// actual layout. Alias the package straight to its compiled CommonJS output
// so resolution is unambiguous everywhere.
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native-svg': 'react-native-svg/lib/commonjs',
};

module.exports = config;
