import { getConfigFromEnv } from './get-config-from-env.js';
import argon2 from 'argon2';

export function generateHash(stringToHash: string): Promise<string> {
	const argon2HashConfigOptions = getConfigFromEnv('HASH_', { omitPrefix: 'HASH_RAW' }); // Disallow the HASH_RAW option, see https://github.com/directus/directus/discussions/7670#discussioncomment-1255805

	// associatedData, if specified, must be passed as a Buffer to argon2.hash, see https://github.com/ranisalt/node-argon2/wiki/Options#associateddata
	if ('associatedData' in argon2HashConfigOptions)
		argon2HashConfigOptions['associatedData'] = Buffer.from(argon2HashConfigOptions['associatedData']);

	return argon2.hash(stringToHash, argon2HashConfigOptions);
}
