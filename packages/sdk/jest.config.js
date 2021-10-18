/**
 * @type {import('@jest/types').Config.InitialOptions}
 */
const config = {
	preset: 'ts-jest/presets/default-esm',
	verbose: true,
	setupFiles: ['./jest.setup.ts'],
	testURL: process.env.TEST_URL || 'http://localhost',
	collectCoverageFrom: ['src/**/*.ts'],
	transformIgnorePatterns: ['dist', 'node_modules/(?!(node-fetch))'],
	globals: {
		'ts-jest': {
			useESM: true,
		},
	},
	moduleNameMapper: {
		'^(\\.{1,2}/.*)\\.js$': '$1',
	},
};

export default config;
