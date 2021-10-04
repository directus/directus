const parentConfig = require('../../.eslintrc.js');

module.exports = {
	...parentConfig,
	parserOptions: {
		...parentConfig.parserOptions,
		sourceType: 'module',
	},
};
