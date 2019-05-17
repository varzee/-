const webpack = require('webpack');
const path = require('path');


module.exports = {
    mode: 'devlopment',
    output: {
        publicPath: '/'
    },
    devtool: 'source-map',
    devServer: {
        contentBase: path.resolve(__dirname, 'dist'),
        host: 'localhost',
        port: 8899,
        hot: true,
        overlay: true,
        index: 'page1.html'
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NamedModulesPlugin()
    ]
}