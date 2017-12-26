/* eslint-env node */

const path = require('path')

module.exports = {
  entry: './example/main',
  output: {
    path: path.join(__dirname, 'example'),
    filename: 'bundle.js'
  },
  devServer: {
    contentBase: path.join(__dirname, 'example'),
    historyApiFallback: true,
    port: 8080
  },
  devtool: '#inline-source-map'
}
