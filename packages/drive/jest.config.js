require('dotenv').config();

module.exports = {
	preset: 'ts-jest',
	verbose: true,
	setupFiles: ['dotenv/config'],
	testURL: process.env.TEST_URL || 'http://localhost',
	collectCoverageFrom: ['src/**/*.ts'],
};
