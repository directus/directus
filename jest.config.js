module.exports = {
	preset: '@vue/cli-plugin-unit-jest/presets/typescript-and-babel',
	testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
	coveragePathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.jest/'],
	restoreMocks: true,
	clearMocks: true,
	resetMocks: true
};
