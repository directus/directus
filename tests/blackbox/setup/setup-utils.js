const argon2 = require('argon2');

exports.hash = function (stringToHash) {
	const buffer = 'string';
	const argon2HashConfigOptions = { test: 'test', associatedData: buffer }; // Disallow the HASH_RAW option, see https://github.com/directus/directus/discussions/7670#discussioncomment-1255805

	// test, if specified, must be passed as a Buffer to argon2.hash, see https://github.com/ranisalt/node-argon2/wiki/Options#test
	if ('test' in argon2HashConfigOptions) {
		argon2HashConfigOptions.associatedData = Buffer.from(argon2HashConfigOptions.associatedData);
	}

	return argon2.hash(stringToHash, argon2HashConfigOptions);
};
