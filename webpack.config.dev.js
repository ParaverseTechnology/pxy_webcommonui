const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const sveltePreprocess = require('svelte-preprocess');
const { execSync } = require('child_process');
const pkg = require('./package.json');
const TerserPlugin = require('terser-webpack-plugin');
const { sass } = sveltePreprocess;

module.exports = {
  // development：会将 DefinePlugin 中 process.env.NODE_ENV 的值设置为 development。
  mode: "development",
  entry: "./test/index.tsx",
  devtool: "eval",
  target: ['web', 'es5'],
  //devtool: "source-map"可build代码，但是速度最慢。
  devServer: {
    hot: true, //热模块：仅更新更改内容；修改js/css后，立即更新浏览器
    static: path.join(__dirname, "./test/public"), //告诉服务器从哪里提供内容
  },
  module: {
    //创建模块时，匹配请求的规则数组。
    rules: [
      {
        test: /\.(js|ts)$/,
        // exclude: /node_modules\/(?!svelte)/,
        use: [{ loader: 'babel-loader' }],
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader',
            options: { minimize: false },
          },
        ],
      },
      {
        test: /\.(svelte)$/,
        use: [
          'babel-loader',
          {
            loader: 'svelte-loader',
            options: {
              preprocess: sveltePreprocess({
                sourceMap: false,
                // babel: babelConfig,
              }),
              compilerOptions: {
                dev: false,
              },
              emitCss: false,
              hotReload: false,
              style: sass(),
              onwarn: (warning, handler) => {
                const { code, frame } = warning;
                if (code === "css-unused-selector" || code === "Unused CSS selector")
                    return;
        
                handler(warning);
              },
            },
          },
        ],
      },
      {
        // required to prevent errors from Svelte on Webpack 5+, omit on Webpack 4
        test: /node_modules\/svelte\/.*\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
        use: ['babel-loader'],
      },
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          "babel-loader",
          {
            loader: "ts-loader",
            options: {
              // 关闭ts类型检查，只进行转译。使用fork-ts-checker-webpack-plugin做类型检查。
              transpileOnly: true,
            },
          },
        ],
      },
      {
        test: /\.less$/,
        use: [
          { loader: "style-loader" },
          { loader: "css-loader" },
          {
            loader: "less-loader",
            options: {
              lessOptions: {
                javascriptEnabled: true, //支持内联js
              },
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [{ loader: "style-loader" }, { loader: "css-loader" }],
      },
      {
        test: /\.(png|jpg|gif|svg|jpeg)$/,
        use: [
          {
            loader: "url-loader",
            options: {
              limit: 1000240, //图片大小限制
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js", ".json", '.html', '.less', '.svelte', ".tsx"],
    //按顺序解析后缀名。生产模式下可以不配置.tsx、.jsx。
    alias: {
      '@': path.resolve(__dirname, "src/"),
      svelte: path.resolve('node_modules', 'svelte'),
    },
    mainFields: ['svelte', 'browser', 'module', 'main'],
  },
  optimization: {
    minimize: false,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./test/public/index.html",
    }),
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        diagnosticOptions: {
          syntactic: true, //语法检查
          semantic: true,  //语义检查
          declaration: true, //声明检查
          global: true,  //全局
        },
      },
    }),
  ],
};
