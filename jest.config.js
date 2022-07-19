module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	moduleNameMapper: {
		'@directus/drive-s3(.*)$': `${__dirname}/packages/drive-s3/src/$1`,
		'@directus/drive-gcs(.*)$': `${__dirname}/packages/drive-gcs/src/$1`,
		'@directus/drive-azure(.*)$': `${__dirname}/packages/drive-azure/src/$1`,
		'@directus/drive(.*)$': `${__dirname}/packages/drive/src/$1`,
		'@directus/extension-sdk(.*)$': `${__dirname}/packages/extension-sdk/src/$1`,
		'@directus/schema(.*)$': `${__dirname}/packages/schema/src/$1`,
		'@directus/shared(.*)$': `${__dirname}/packages/shared/src/$1`,
		'@directus/specs(.*)$': `${__dirname}/packages/specs/$1`,
	},
	globals: {
		'ts-jest': {
			tsconfig: {
				sourceMap: true,
			},
		},
	},
};
