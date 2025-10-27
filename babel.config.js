module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],  // Expo 默认预设
    plugins: [
      'react-native-reanimated/plugin',
    ],
  };
};