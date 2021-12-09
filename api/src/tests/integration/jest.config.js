const base = require('../../../../jest.config.js');

require('dotenv').config();

module.exports = {
	...base,
	roots: ['../'],
	verbose: true,
	setupFiles: ['./utils/mock-env.ts'],
	testURL: process.env.TEST_URL || 'http://localhost',
	collectCoverageFrom: ['src/**/*.ts'],
};
