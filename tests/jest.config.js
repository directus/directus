module.exports = {
	preset: 'ts-jest',
	verbose: true,
	globalSetup: './setup/setup.ts',
	globalTeardown: './setup/teardown.ts',
	modulePathIgnorePatterns: ['./setup/utils'],
	testSequencer: './setup/customSequencer.js',
	testEnvironment: './setup/customEnvironment.ts',
};
