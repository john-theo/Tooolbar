const path = require('path');
const TerserPlugin = require("terser-webpack-plugin");
const dotenv = require('dotenv').config({ path: __dirname + '/.env' });
const webpack = require("webpack");
const DtsBundlePlugin = require('dts-bundle-webpack');


const ENVS = dotenv.parsed;

const config = {
    entry: './src/index.ts',
    target: 'web',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'index.min.js',
        library: ENVS.APP_NAME,
        libraryTarget: 'umd',
        globalObject: 'this',
        umdNamedDefine: true,
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader'
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    // Creates `style` nodes from JS strings
                    "style-loader",
                    // Translates CSS into CommonJS
                    "css-loader",
                    // Compiles Sass to CSS
                    {
                        loader: "sass-loader",
                        options: {
                            // Prefer `dart-sass`
                            implementation: require("sass"),
                            // Global variable hack
                            additionalData: `$app-name: ${ENVS.APP_NAME.toLowerCase()};`
                        },
                    },
                ],
            },
            {
                test: /\.css/i,
                use: ["style-loader", "css-loader"]
            },
        ],
    },
    plugins: [
        new webpack.DefinePlugin({
            "process.env": JSON.stringify(ENVS)
        })
    ],
    resolve: {
        extensions: ['.ts', '.js'],
    },
    optimization: {},
    devtool: "cheap-source-map"
};


module.exports = (_, argv) => {
    const isProduction = argv.mode === 'production';
    if (!isProduction) {
        config.optimization.minimize = false;
        config.optimization.usedExports = false;
    } else {
        config.plugins.push(new DtsBundlePlugin({
            name: ENVS.APP_NAME,
            main: 'dist/index.d.ts',
            out: 'index.d.ts',
            removeSource: true,
            outputAsModuleFolder: true
        }));
        config.optimization = {
            usedExports: true,
            minimize: true,
            minimizer: [
                new TerserPlugin({
                    extractComments: false,
                    parallel: true,
                    terserOptions: {
                        keep_classnames: true,
                        keep_fnames: !isProduction,
                        sourceMap: !isProduction,
                        warnings: !isProduction,
                        ie8: false,
                        format: {
                            comments: false,
                        },
                        mangle: isProduction,
                        compress: {
                            drop_console: isProduction
                        }
                    },
                })
            ],
        };
    }
    return config;
};
