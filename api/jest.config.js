const base = require('../jest.config.js');

require('dotenv').config();

module.exports = {
	...base,
	roots: ['<rootDir>/tests', '<rootDir>/src'],
	verbose: true,
	setupFiles: ['dotenv/config'],
	testURL: process.env.TEST_URL || 'http://localhost',
	collectCoverageFrom: ['src/**/*.ts'],
};
