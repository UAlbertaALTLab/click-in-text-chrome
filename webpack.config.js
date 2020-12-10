const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')
let webpack = require('webpack')

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development'

const config = {
  devtool: 'source-map',
  mode,
  entry: {
    // browser specific scripts (where browser specific API resides)
    background: './background.js',
    contentscript: './contentscript.js',

    // browser API independent scripts that go with respective HTML files
    // Note the first two are injected to the <head> of user-opened web-pages every time user opens a tab
    // while options_script.js is embedded in options.html
    tat_popup: './lib/tat_popup.js', // this is the script for "type-and-translate" popup
    popup: './lib/popup.js', // this is the script for click-in-text popup
    options_script: './lib/options_script.js', // this is the script for click-in-text configuration page

    // this script imitates contentscript.js and allows integration tests to be run by mocking browser APIs
    test: './test.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [/node_modules/],
        use: {
          loader: 'babel-loader',
          options: {
            plugins: ['@babel/plugin-transform-classes']
          }
        }
      }
    ]
  },

  plugins: [
    new CleanWebpackPlugin(['dist']),
    new CopyWebpackPlugin([
      'manifest.json',
      'icons/*.png',
      'test.html',
      'options.html',
      'lib/popup.html',
      'lib/tat_popup.html',
      'node_modules/xregexp/xregexp-all.js'
    ], {to: 'dist'}),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    }) // this makes $ and jQuery globally recognizable and automatically packed in this project. (FYI, this setup by default looks for 'jquery' in node_modules)
  ],

}

module.exports = config
