const path = require('path');
const { mergeConfig } = require('vite');

module.exports = {
	async viteFinal(config) {
		return mergeConfig(config, {
			resolve: {
				dedupe: ['@storybook/client-api'],
				alias: [
					{
						find: '@',
						replacement: path.resolve(__dirname, '..', 'src'),
					},
				],
			},
		});
	},

	stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
	addons: [
		'@storybook/addon-links',
		'@storybook/addon-essentials',
		'@storybook/addon-actions',
		'@storybook/addon-mdx-gfm',
	],
	framework: {
		name: '@storybook/vue3-vite',
		options: {},
	},
	docs: {
		autodocs: true,
	},
};
