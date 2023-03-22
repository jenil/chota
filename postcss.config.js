const { version } = require("./package.json");

let plugins = [
  require("postcss-banner")({
    banner: `chota.css v${version} | MIT License | https://github.com/jenil/chota`,
    important: true,
  }),
  require("postcss-import")({
    plugins: [require("stylelint")({ fix: true, formatter: "compact" })],
  }),
  require("autoprefixer")(),
  require("postcss-reporter")({ clearReportedMessages: true }),
];

// if (process.env.NODE_ENV == 'production') plugins.push(require("postcss-csso"))
if (process.env.NODE_ENV == "production")
  plugins.push(
    require("cssnano")({
      preset: "default",
    })
  );

module.exports = {
  plugins,
};
