import webpack from 'webpack';
import type IForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import WebpackShellPluginNext from "webpack-shell-plugin-next";


// eslint-disable-next-line @typescript-eslint/no-var-requires
const ForkTsCheckerWebpackPlugin: typeof IForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

export const plugins = [
  new webpack.NormalModuleReplacementPlugin(/^node:crypto$/, 'crypto'),
  new webpack.NormalModuleReplacementPlugin(/^node:fs$/, 'fs'),
  new WebpackShellPluginNext({
    onBuildStart:{
      scripts: ['node copy-assets.js'],
      blocking: true,
      parallel: false
    }
  }),
  new ForkTsCheckerWebpackPlugin({
    logger: 'webpack-infrastructure',
  }),
];
