/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */

const base = require('../jest.config.js');

module.exports = {
	...base,
	moduleNameMapper: {
		...base.moduleNameMapper,
		'@/(.*)$': `${__dirname}/src/$1`,
	},
};
