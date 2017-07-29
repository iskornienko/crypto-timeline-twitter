var webpack = require('webpack'),
    path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    debug: true,
    entry: [
        'babel-polyfill','./src/frontend/app.js'
    ],
    output:{
        path:path.join(__dirname,'dist'),
        filename:'bundle.js'
    },
    externals:{
    },
    module: {
        loaders: [{
            test: /\.js$/,
            loader: 'babel',
            exclude: /node_modules/
        },{
            test: /\.css$/,
            loader: "style-loader!css-loader"
        },{
            test: /\.woff|\.woff2|\.svg|.eot|\.ttf/,
            loader: 'file?prefix=public/fonts/'
        },{
            test: /\.png|\.jpg/,
            loader: 'file?prefix=public/assets/'
        },{
            test: /\.html$/,
            loader: 'raw'
        },
            {
                test: /\.less$/,
                loader: "style!css!less"
            }]
    },
    plugins : [
        new HtmlWebpackPlugin({
            template: './src/frontend/index.html',
            inject: 'body'
        })
    ],
    devServer : {
        proxy: {
            '/api/**': {
                target: 'http://127.0.0.1:3001',
                secure: false
            },
            '/socket.io/**': {
                target: 'http://127.0.0.1:3001',
                secure: false
            }
        }
    }
};
