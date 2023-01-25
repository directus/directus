module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	moduleNameMapper: {
		'@directus/storage-driver-s3(.*)$': `${__dirname}/packages/storage-driver-s3/src/$1`,
		'@directus/storage-driver-gcs(.*)$': `${__dirname}/packages/storage-driver-gcs/src/$1`,
		'@directus/storage-driver-azure(.*)$': `${__dirname}/packages/storage-driver-azure/src/$1`,
		'@directus/storage-driver-cloudinary(.*)$': `${__dirname}/packages/storage-driver-cloudinary/src/$1`,
		'@directus/storage(.*)$': `${__dirname}/packages/storage/src/$1`,
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
