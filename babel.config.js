module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ["module:react-native-dotenv", {
        "moduleName": "@env",
        "path": ".env",
        "blacklist": null,
        "whitelist": null,
        "safe": false,
        "allowUndefined": true
      }],
      // Requis par les décorateurs @nozbe/watermelondb (@field, @date, @children, @relation...)
      // dans src/database/models/*.js.
      ["@babel/plugin-proposal-decorators", { "legacy": true }],
    ],
  };
};
