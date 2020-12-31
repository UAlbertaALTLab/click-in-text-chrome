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
    background: './src/browser/background.ts',
    contentscript: './src/browser/contentscript.ts',

    // browser API independent scripts that go with respective HTML files
    // Note the first two are injected to the <head> of user-opened web-pages every time user opens a tab
    // while options_script.js is embedded in options.html
    tat_popup: './src/lib/tat_popup.ts', // this is the script for "type-and-translate" popup
    popup: './src/lib/popup.ts', // this is the script for click-in-text popup

    options_script: './src/browser/options_script.ts', // this is the script for click-in-text configuration page

    // this script imitates contentscript.ts and allows integration tests to be run by mocking browser APIs
    test: './src/embedded/test.ts'
  },
  resolve: {
    extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js'],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
      {test: /\.tsx?$/, loader: 'ts-loader'},

      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      {test: /\.js$/, loader: 'source-map-loader'},

      // used to load popup.html and tat_popup.html in js
      {test: /\.html$/i, loader: 'html-loader',}
    ]
  },

  plugins: [
    new CleanWebpackPlugin(['dist']),
    // files that directly copy to ./dist/ in a flatterned way
    new CopyWebpackPlugin(
      [
        'src/browser/manifest.json',

        // todo: consider getting rid of these by writing them in JS
        'src/embedded/test.html',
        'src/browser/options.html',

        'node_modules/xregexp/xregexp-all.js'
      ], {to: 'dist'}
    ),
    // icon images that go to ./dist/icons
    new CopyWebpackPlugin(
      [
        'icons/*.png',
      ], {context: 'src', to: 'dist'}
    ),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    }) // this makes $ and jQuery globally recognizable and automatically packed in this project. (FYI, this setup by default looks for 'jquery' in node_modules)
  ],

}

module.exports = config
