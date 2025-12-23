const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  entry: {
    popup: './src/popup.js',
    background: './src/background.js',
    content: './src/content.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules\/(?!@mozilla\/readability)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['@babel/preset-env', { modules: false }]],
          },
        },
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/popup.html', to: 'popup.html' },
        { from: 'src/popup.css', to: 'popup.css' },
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'icons', to: 'icons', noErrorOnMissing: true },
      ],
    }),
  ],
  resolve: {
    extensions: ['.js'],
    fallback: {
      "jsdom": false,
      "canvas": false,
      "buffer": false,
      "stream": false,
    },
  },
  externals: {
    // Don't bundle jsdom, it's not needed in browser
  },
  optimization: {
    // Ensure Readability is bundled properly
    usedExports: true,
  },
  mode: 'development',
  devtool: 'source-map',
}

