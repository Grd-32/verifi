module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['module:@react-native/babel-preset'], // Use 'babel-preset-expo' if using Expo
    plugins: [
      ['@babel/plugin-transform-private-methods', { loose: true }]
    ],
  };
};
