const path = require('path');
const fs = require('fs');
const argv = require('yargs').argv; //获取命令行参数
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const WebpackMerge = require('webpack-merge');
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); //将css单独打包成文件


const envConfig = require('./webpackConfig/webpack.dev.config');
const prodConfig = require('./webpackConfig/webpack.product.config');

const isDev = process.env.NODE_ENV === 'development';

/**
 * 获取所有配置页面入口
 * @param {string} path 需要查找的文件目录
 * @param {string} type 需要查找的文件类型
 */
function getAllEntry(path, type, allEntry = {}) {
    const fileList = fs.readdirSync(path);
    for (let dir of fileList) {
        let isDir = fs.lstatSync(`${path}${dir}`).isDirectory();
        if (isDir) {
            getAllEntry(`${path}${dir}/`, type, allEntry);
        } else {
            let reg = new RegExp(`\\.${type}`);
            if (reg.test(dir)) {
                let name = dir.split(`.${type}`)[0];
                allEntry[name] = `${path}${dir}`;
            }
        }
    };
    return allEntry;
}

/**
 * 添加所有模版的htmlPlugin
 * @param {object} allPath 模版路径对象
 */
function getHtmlPlugin(allPath) {
    let pluginLists = [];
    Object.keys(allPath).forEach(v => {
        pluginLists.push(
            new HtmlWebpackPlugin({
                template: allPath[v],
                chunks: [v],
                filename: `${v}.html`
            })
        )
    })
    return pluginLists;
}

//公共基本配置
const commonBaseConfig = {
    output: {
        path: path.resolve(__dirname, 'dist')
    },
    resolve: {
        extensions: ['.js', '.vue', '.json'],
        alias: {
            'vue$': 'vue/dist/vue.esm.js',
            '@': path.resolve(__dirname),
            'img': path.resolve(__dirname, 'src/assets/images')
        }
    },
    module: {
        rules: [
            { test: /\.js/, exclude: /node_modules/, use: 'babel-loader' },
            { test: /\.html/, use: { loader: 'html-loader', options: { interpolate: true, minimize: true } } },
            { test: /\.vue/, use: 'vue-loader' },
            {
                test: /\.(jpg|png|gif|jpeg)$/, use: [{
                    loader: 'url-loader', options: {
                        name: '[name]-[hash:5].min.[ext]',
                        limit: 30000,
                        outputPath: 'images/',
                    }
                }]
            },
            {
                test: /\.(eot|woff2?|ttf|svg)$/, use: [{
                    loader: 'url-loader', options: {
                        name: '[name]-[hash:5].min.[ext]',
                        limit: 5000,
                        outputPath: 'fonts/'
                    }
                }]
            },
            { test: /\.(sc|sa|c)ss/, use: [isDev ? 'vue-style-loader' : { loader: MiniCssExtractPlugin.loader }, { loader: 'css-loader', options: { importLoaders: 2 } }, 'postcss-loader', { loader: 'sass-loader', options: { data: `@import './index.scss';` } }] }
        ]
    },
}

//单页面配置
const baseConfig = {
    entry: {
        app: './main.js',
    },
    ...commonBaseConfig,
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html',
        }),
        new CleanWebpackPlugin(),
        new VueLoaderPlugin(),
    ]
}

//多页面配置
const dirPath = `./src/multiPage/${argv.pageName || index}/`; //需打包的文件路径

const multiPageBaseConfig = {
    entry: getAllEntry(dirPath, 'js'),
    ...commonBaseConfig,
    plugins: [
        new CleanWebpackPlugin(),
        ...getHtmlPlugin(getAllEntry(dirPath, 'html')),
        new MiniCssExtractPlugin(),
        new VueLoaderPlugin(),
    ]
}

module.exports = (env, argv) => {
    console.log(argv.mode, isDev)
    const extraConfig = argv.mode === 'development' ? envConfig : prodConfig;
    const webpackConfig = WebpackMerge(multiPageBaseConfig, extraConfig);
    return webpackConfig;
}