// const { pathsToModuleNameMapper } = require('ts-jest');
// const { compilerOptions } = require('./tsconfig');

module.exports = {
	preset: 'ts-jest',
	verbose: true,
	globalSetup: './setup/setup.ts',
	globalTeardown: './setup/teardown.ts',
	modulePathIgnorePatterns: ['./setup/utils'],
	testSequencer: './setup/customSequencer.js',
	testEnvironment: './setup/customEnvironment.ts',
	// moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
	moduleNameMapper: {
		'@directus/cli(.*)$': `${__dirname}/../packages/cli/src/$1`,
		'@directus/create-directus-project(.*)$': `${__dirname}/../packages/create-directus-project/src/$1`,
		'@directus/drive-s3(.*)$': `${__dirname}/../packages/drive-s3/src/$1`,
		'@directus/drive-gcs(.*)$': `${__dirname}/../packages/drive-gcs/src/$1`,
		'@directus/drive-azure(.*)$': `${__dirname}/../packages/drive-azure/src/$1`,
		'@directus/drive(.*)$': `${__dirname}/../packages/drive/src/$1`,
		'@directus/extension-sdk(.*)$': `${__dirname}/../packages/extension-sdk/src/$1`,
		'@directus/format-title(.*)$': `${__dirname}/../packages/format-title/src/$1`,
		'@directus/gatsby-source-directus(.*)$': `${__dirname}/../packages/gatsby-source-directus/src/$1`,
		'@directus/schema(.*)$': `${__dirname}/../packages/schema/src/$1`,
		'@directus/sdk(.*)$': `${__dirname}/../packages/sdk/src/$1`,
		'@directus/shared(.*)$': `${__dirname}/../packages/shared/src/$1`,
		'@directus/specs(.*)$': `${__dirname}/../packages/specs/$1`,
		'@common/(.*)$': `${__dirname}/common/$1`,
		'@utils/(.*)$': `${__dirname}/utils/$1`,
		'@query/(.*)$': `${__dirname}/query/$1`,
		'@schema/(.*)$': `${__dirname}/schema/$1`,
	},
};
