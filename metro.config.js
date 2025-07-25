const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add web support
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Handle web-specific modules
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native$': 'react-native-web',
};

module.exports = config;
