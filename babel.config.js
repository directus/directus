module.exports = {
	presets: [
		[
			'@vue/app',
			{
				targets: { esmodules: true },
				polyfills: [],
			},
		],
	],
	plugins: ['@babel/plugin-proposal-optional-chaining'],
};
