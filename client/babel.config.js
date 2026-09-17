module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Required for WatermelonDB's @field/@date/@children decorator syntax
    // used in data/local/models/*.
    plugins: [['@babel/plugin-proposal-decorators', { legacy: true }]],
  };
};
