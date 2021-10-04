import { config as dotenv } from 'dotenv';
dotenv();

export default {
	preset: 'ts-jest',
	verbose: true,
	setupFiles: ['dotenv/config'],
	testURL: process.env.TEST_URL || 'http://localhost',
	collectCoverageFrom: ['src/**/*.ts'],
	testPathIgnorePatterns: ['dist'],
	moduleNameMapper: {
		'^@/(.*).js$': '<rootDir>/$1',
	},
};
