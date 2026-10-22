const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for Windows: Metro's FallbackWatcher tries to watch directories that
// don't exist, causing ENOENT race conditions. Extend blockList to cover all
// known missing directories on Windows.
const existingBlockList = config.resolver.blockList;

config.resolver.blockList = [
  // @react-native temp gradle plugin dirs (deleted mid-watch)
  /node_modules[/\\]@react-native[/\\]\.gradle-plugin-.*/,
  // react-native/jest dir missing in some RN versions
  /node_modules[/\\]react-native[/\\]jest.*/,
  // expo-modules-autolinking gradle plugin dirs
  /node_modules[/\\]expo-modules-autolinking[/\\]android[/\\].*/,
  ...(Array.isArray(existingBlockList)
    ? existingBlockList
    : existingBlockList
    ? [existingBlockList]
    : []),
];

module.exports = config;
