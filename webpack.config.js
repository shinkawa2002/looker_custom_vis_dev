const path = require("path");
const { merge } = require("webpack-merge");
const commonConfig = require("./config/webpack.common");

module.exports = (env) => {
  const visSpecific = {
    entry: {
      score_card_v2: path.join(__dirname, "src/score_card_v2", "main.js"),
      bullet: path.join(__dirname, "src/bullet_chart", "main.js"),
      timeline_v2: path.join(__dirname, "src/timeline", "main.js"),
      stackedBar: path.join(__dirname, "src/barchart", "main.js"),
      scrollBarchart: path.join(__dirname, "src/barchart_scroll", "main.js"),
      a_good_table: path.join(__dirname, "src/a-good-table", "main.js"),
      stackedBar: path.join(__dirname, "src/stackedBar", "main.js"),
    },
    output: {
      filename: "[name].js",
      library: "[name]",
      path: path.join(__dirname, "dist"),
    },
    module: {
      rules: [
        {
          test: /\.(png|jpe?g|gif)$/i,
          loader: 'file-loader',
          options: {
            name: '[path][name].[ext]',
          },
        },
      ],
    },
    devServer: {
      port: 8081,
    },
  };
  const config = require("./config/webpack." + env.environment);
  return merge(commonConfig, visSpecific, config);
};
