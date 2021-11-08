const { getDefaultConfig } = require("@expo/metro-config");
const defaultConfig = getDefaultConfig(__dirname);
const assetExt = defaultConfig.resolver.assetExts.filter(
  (ext) => ext !== "svg"
);
module.exports = {
  transformer: {
    babelTransformerPath: require.resolve("react-native-svg-transformer"),
  },
  resolver: {
    assetExts: [...assetExt],
    sourceExts: [...defaultConfig.resolver.sourceExts, "svg"],
  },
};
