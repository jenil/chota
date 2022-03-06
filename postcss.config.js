let plugins = [
  require("postcss-import"),
  require("autoprefixer")()
];

// if (process.env.NODE_ENV == 'production') plugins.push(require("postcss-csso"))
if (process.env.NODE_ENV == "production")
  plugins.push(
    require("cssnano")({
      preset: "default"
    })
  );

if (process.env.VARIANT == "100")
  plugins.push(
    require("postcss-revert-rem-size")({})
  );

module.exports = {
  plugins
};
