import type { Knex } from 'knex';
import { getDatabase } from '../database/index.js';
import { decrypt } from '../utils/encrypt.js';
import { getSecret } from '../utils/get-secret.js';
import { getEnvLicense } from './env.js';
import { normalizeOptionalLicenseKey } from './license-context.js';
import type { LicenseSource } from './types.js';

type LicenseKeyState = {
	licenseKey: string | undefined;
	source: LicenseSource;
};

export async function getLicenseKeyState(knex?: Knex): Promise<LicenseKeyState> {
	const env = getEnvLicense();

	if (env.source === 'env') {
		return {
			licenseKey: env.mode === 'env_key' ? env.value : undefined,
			source: 'env',
		};
	}

	const database = knex ?? getDatabase();
	const settingsRow = await database.select('license_key').from('directus_settings').first();
	const encryptedKey = settingsRow?.license_key;
	let licenseKey: string | undefined;

	if (typeof encryptedKey === 'string' && encryptedKey !== '') {
		const secret = getSecret();
		licenseKey = normalizeOptionalLicenseKey(await decrypt(encryptedKey, secret)) ?? undefined;
	}

	return {
		licenseKey,
		source: licenseKey ? 'settings' : null,
	};
}
