var path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './app/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public/js')
  },
  module: {
    loaders: [
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['stage-2', 'es2017'],
            plugins: ["transform-async-to-generator"],
          },
        }
      }
    ]
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
        mangle: true
    }),
  ]
}