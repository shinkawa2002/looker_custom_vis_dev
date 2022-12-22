const path = require("path");
const { merge } = require("webpack-merge");
const commonConfig = require("./config/webpack.common");

module.exports = (env) => {
  const visSpecific = {
    entry: {
      score_card_v2: path.join(__dirname, "score_card_v2", "main.js"),
      bullet: path.join(__dirname, "bullet_chart", "main.js"),
      timeline_v2: path.join(__dirname, "timeline", "main.js"),
      stackedBar: path.join(__dirname, "barchart", "main.js"),
      scrollBarchart: path.join(__dirname, "barchart_scroll", "main.js"),
    },
    output: {
      filename: "[name].js",
      library: "[name]",
      path: path.join(__dirname, "dist"),
    },
    devServer: {
      port: 8081,
    },
  };
  const config = require("./config/webpack." + env.environment);
  return merge(commonConfig, visSpecific, config);
};
