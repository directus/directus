const esModules = ['@popperjs/core'].join('|');

module.exports = {
	preset: '@vue/cli-plugin-unit-jest/presets/typescript-and-babel',
	testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
	coveragePathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.jest/'],
	transformIgnorePatterns: [`/node_modules/(?!${esModules})`],
	restoreMocks: true,
	clearMocks: true,
	resetMocks: true,
	reporters: [
		'default',
		[
			'jest-sonar',
			{
				outputDirectory: 'coverage',
				outputName: 'sonar.xml',
			},
		],
	],
};
