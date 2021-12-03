module.exports = {
	preset: 'ts-jest',
	verbose: true,
	globalSetup: './e2e/setup/setup.ts',
	globalTeardown: './e2e/setup/teardown.ts',
	modulePathIgnorePatterns: ['e2e/setup/utils'],
};
