import { useEnv } from '@directus/env';
import type { LicenseSource } from '@directus/license';
import type { Knex } from 'knex';
import { SettingsService } from '../../services/settings.js';
import { getSchema } from '../../utils/get-schema.js';

export async function getLicenseToken(options?: {
	database?: Knex;
}): Promise<{ source: LicenseSource; token: string | null }> {
	const env = useEnv();

	if (env['LICENSE_TOKEN']) {
		return {
			source: 'env',
			token: String(env['LICENSE_TOKEN']),
		};
	}

	const schema = await getSchema(options);
	const settingsService = new SettingsService({ schema, ...options });

	const { license_token } = await settingsService.readSingleton({ fields: ['license_token'] });

	return {
		source: 'settings',
		token: license_token ?? null,
	};
}
