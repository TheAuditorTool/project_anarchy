/**
 * Webpack configuration for React project
 * Phase 13: Framework Misconfigurations
 * ERROR 238: Source maps enabled in production mode
 */

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      clean: true,
    },
    
    // ERROR 238: Source maps in production (exposes source code)
    devtool: 'source-map',  // Should be false or 'hidden-source-map' in production
    
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react'],
            },
          },
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
        },
      ],
    },
    
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
      }),
      // Environment variables exposed in bundle
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(argv.mode),
        'process.env.API_ENDPOINT': JSON.stringify('https://api.production.com'),
        'process.env.ANALYTICS_KEY': JSON.stringify('UA-123456789-1'),
      }),
    ],
    
    resolve: {
      extensions: ['.js', '.jsx'],
    },
    
    devServer: {
      static: {
        directory: path.join(__dirname, 'public'),
      },
      compress: true,
      port: 3000,
      hot: true,
      // CORS completely disabled
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "*"
      },
    },
    
    // No optimization in production
    optimization: isProduction ? {
      minimize: false,  // Minification disabled
      splitChunks: {
        chunks: 'none',  // No code splitting
      },
    } : {},
    
    // Performance hints disabled
    performance: {
      hints: false,
    },
  };
};