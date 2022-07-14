/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
const base = require('../jest.config.js');

require('dotenv').config();

module.exports = {
	...base,
	preset: 'ts-jest',
	testEnvironment: 'node',
	moduleNameMapper: {
		...base.moduleNameMapper,
		'@/(.*)': `${__dirname}/src/$1`,
	},
};
