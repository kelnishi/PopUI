import type { Configuration } from 'webpack';

import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';
import path from "path";

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

export const rendererConfig: Configuration = {
  module: {
    rules,
  },
  plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    alias: {
      '@': path.resolve(__dirname, '.'),
      // Redirect node: imports to the corresponding polyfills or disable them
      'node:crypto': 'crypto',
      'node:fs': false,
      'node:assert': 'assert',
      'node:util': 'util',
    },
    fallback: {
      fs: false,
      child_process: false,
      path: require.resolve("path-browserify"),
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      zlib: require.resolve("browserify-zlib"),
      querystring: require.resolve("querystring-es3"),
      http: require.resolve("stream-http"),
      https: require.resolve("https-browserify"),
      os: require.resolve("os-browserify/browser"),
      url: require.resolve("url/"),
      async_hooks: false,
      vm: require.resolve("vm-browserify"),
      assert: require.resolve("assert/"),
      util: require.resolve("util/"),
      net: false
    }
  },
};
