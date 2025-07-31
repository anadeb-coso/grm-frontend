// const { getDefaultConfig } = require("@expo/metro-config");
// const defaultConfig = getDefaultConfig(__dirname);
// const assetExt = defaultConfig.resolver.assetExts.filter(
//   (ext) => ext !== "svg"
// );
// module.exports = {
//   transformer: {
//     babelTransformerPath: require.resolve("react-native-svg-transformer"),
//     assetPlugins: ['expo-asset/tools/hashAssetFiles'],
//   },
//   resolver: {
//     assetExts: [...assetExt],
//     sourceExts: [...defaultConfig.resolver.sourceExts, "svg"],
//   },
// };
const { getDefaultConfig } = require('expo/metro-config');

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);
  const { transformer, resolver } = config;

  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  };
  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...resolver.sourceExts, 'svg'],
  };

  return config;
})();