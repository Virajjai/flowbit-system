const ModuleFederationPlugin = require("@module-federation/webpack");

module.exports = {
  mode: "development",
  devServer: {
    port: 3002,
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "supportTicketsApp",
      filename: "remoteEntry.js",
      exposes: {
        "./SupportTicketsApp": "./src/SupportTicketsApp",
      },
      shared: {
        react: { singleton: true, eager: true },
        "react-dom": { singleton: true, eager: true },
      },
    }),
  ],
};
