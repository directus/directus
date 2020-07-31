/* @tslint:disable */
/* eslint-disable */

const WebpackAssetsManifest = require('webpack-assets-manifest');

if (!process.env.API_URL && process.env.NODE_ENV === 'development') {
	console.log(`
⚠️   No API URL passed. Using the demo API as a fallback.
`);
}

module.exports = {
	lintOnSave: false,
	publicPath: '/admin/',

	devServer: {
		allowedHosts: ['localhost', '.gitpod.io'],
		public: '127.0.0.1:8080',
		proxy: {
			'/': {
				target: process.env.API_URL ? process.env.API_URL : 'https://demo.directus.io/',
				changeOrigin: true,
				bypass: (req) => (req.url.startsWith('/admin') ? req.url : null),
			},
		},
	},

	configureWebpack: {
		plugins: [new WebpackAssetsManifest({ output: 'assets.json' })],
	},

	// There are so many chunks (from all the interfaces / layouts) that we need to make sure to not
	// prefetch them all. Prefetching them all will cause the server to apply rate limits in most cases
	chainWebpack: (config) => {
		config.plugins.delete('prefetch');

		if (process.env.NODE_ENV === 'development') {
			config.output.filename('[name].[hash].js').end();
		}
	},

	productionSourceMap: false
};
