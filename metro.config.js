const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add web support
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Handle web-specific modules
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native$': 'react-native-web',
};

// Add better file watching configuration
config.watchFolders = [__dirname];
config.resolver.nodeModulesPaths = [__dirname + '/node_modules'];

// Configure file watching to ignore problematic directories
config.resolver.blockList = [
  /node_modules\/.*\/example/,
  /node_modules\/.*\/test/,
  /node_modules\/.*\/tests/,
];

// Add error handling for file watching
config.resolver.enableGlobalPackages = true;

module.exports = config;
