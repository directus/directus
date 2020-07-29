const path = require("path");
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
	stories: ['../src/**/*.story.ts'],
	addons: [
		'@storybook/addon-notes/register',
		'@storybook/addon-actions',
		'@storybook/addon-knobs',
		'@storybook/addon-viewport/register',
		'storybook-addon-themes'
	],
	webpackFinal: async (config, { configType }) => {
		config.resolve.alias = {
			...config.resolve.alias,
			'@': path.resolve(__dirname, '../src')
		};

		config.module.rules.push({
			test: /\.scss$/,
			use: ['style-loader', 'css-loader', 'sass-loader'],
			include: path.resolve(__dirname, '../'),
		});

		config.module.rules.push({
			test: /\.ts$/,
			exclude: /node_modules/,
			use: [
				{
					loader: 'babel-loader'
				},
				{
					loader: 'ts-loader',
					options: {
						appendTsSuffixTo: [/\.vue$/],
						transpileOnly: true
					},
				}
			],
		});

		config.resolve.extensions.push('.ts', '.tsx');

		// Return the altered config
		return config;
	}
}
