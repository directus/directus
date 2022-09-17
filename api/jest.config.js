const base = require('../jest.config.js');

require('dotenv').config();

module.exports = {
	...base,
	roots: ['<rootDir>/src'],
	verbose: true,
	setupFiles: ['dotenv/config'],
	collectCoverageFrom: ['src/**/*.ts'],
	testEnvironmentOptions: {
		url: process.env.TEST_URL || 'http://localhost',
	},
};
