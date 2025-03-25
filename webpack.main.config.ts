import webpack, {Configuration, WebpackPluginInstance} from 'webpack';
import * as path from 'path';
import {rules} from './webpack.rules';
import CopyWebpackPlugin from "copy-webpack-plugin";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";

function copyNodeJsModule(workspace: string, pkg: string, file: string) {
    return {
        from: path.join(workspace, 'node_modules', pkg, file),
        to: `assets/${file}`
    };
}

const plugins: WebpackPluginInstance[] = [
    new webpack.NormalModuleReplacementPlugin(/^node:crypto$/, 'crypto'),
    new webpack.NormalModuleReplacementPlugin(/^node:fs$/, 'fs'),
    new CopyWebpackPlugin({
        patterns: [
            {from: 'src/assets', to: 'assets'},
            {from: 'src/scripts', to: 'scripts'},
            {from: 'src/styles', to: 'styles'},
            {
                from: 'src/templates',
                to: 'templates',
                globOptions: {
                    ignore: ['**/node_modules/**', '**/package.json', '**/package-lock.json']
                }
            },
            copyNodeJsModule('src/templates', '@babel/standalone', 'babel.min.js'),
            copyNodeJsModule('src/templates', 'react/umd', 'react.development.js'),
            copyNodeJsModule('src/templates', 'react-dom/umd', 'react-dom.development.js'),
            copyNodeJsModule('src/templates', 'postcss/lib', 'postcss.js'),
            copyNodeJsModule('src/templates', 'twind', 'twind.umd.js'),
            copyNodeJsModule('src/templates', 'lucide/dist/umd', 'lucide.js')
        ]
    }),
    new ForkTsCheckerWebpackPlugin({
        logger: 'webpack-infrastructure',
    }),
];

export const mainConfig: Configuration = {
    /**
     * This is the main entry point for your application, it's the first file
     * that runs in the main process.
     */
    entry: './src/main.ts',
    name: 'main',
    // Put your normal webpack config below here
    module: {
        rules,
    },
    plugins,
    resolve: {
        extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
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
