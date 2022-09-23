const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const sveltePreprocess = require('svelte-preprocess');
const { execSync } = require('child_process');
const pkg = require('./package.json');
const TerserPlugin = require('terser-webpack-plugin');
const { sass } = sveltePreprocess;

module.exports = {
  // production：会将 DefinePlugin 中 process.env.NODE_ENV 的值设置为 production。
  mode: "production",
  entry: "./src/index.ts",
  devtool: false,
  target: ['web', 'es5'],
  output: {
    path: path.resolve(__dirname, "dist"), //输出目录对应绝对路径;  '/dist'
    filename: "pxy_webcommonui.min.js", //决定bundle输出名称
    library: {
      name: 'pxy_webcommonui',
      // type: "module", //同output.libraryTarget, 配置如何暴露library（影响打包文件的导出方式：变量/对象/模块）
      type: "umd", //同output.libraryTarget, 配置如何暴露library（影响打包文件的导出方式：变量/对象/模块）
      umdNamedDefine: true,
      export: "default",
    },
    globalObject: 'this || self',
    // umdNamedDefine: true, //当library.type为'umd'时，umdNamedDefine为true，将命名由umd构建的amd模块
  },
  experiments: {
    // outputModule: true, //library.type设置为'module'时，需要启用该项（webpack5供用户启用的实验性特性）
  },
  module: {
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
        test: /\.(less|css)$/i,
        use: [
          {
            loader: 'style-loader',
            options: { injectType: 'lazySingletonStyleTag' },
          },
          { loader: 'css-loader' },
          {
            loader: 'less-loader',
            options: {
              lessOptions: { math: 'always' },
            },
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
            // 生产环境，可以选择保留声明文件，不设置transpileOnly
          },
        ],
      },
      //.less .css 和 图片的 rules 配置 同上。
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
    extensions: [".ts", ".js", ".json", '.html', '.less', '.svelte'], //可以只选择需要解析的文件类型
    alias: {
      '@': path.resolve(__dirname, "src"),
      svelte: path.resolve('node_modules', 'svelte'),
    },
    mainFields: ['svelte', 'browser', 'module', 'main'],
  },
  plugins: [
    new CleanWebpackPlugin(),
  ],
  stats: {
    colors: true,
    errorDetails: true,
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  },
  watchOptions: {
    ignored: ['**/node_modules'],
  },
};