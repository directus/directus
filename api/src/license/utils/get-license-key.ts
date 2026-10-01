import { useEnv } from '@directus/env';
import type { LicenseSource } from '@directus/license';
import type { Knex } from 'knex';
import { SettingsService } from '../../services/settings.js';
import { getSchema } from '../../utils/get-schema.js';

export async function getLicenseKey(options?: {
	database?: Knex;
}): Promise<{ source: LicenseSource; key: string | null }> {
	const { LICENSE_KEY } = useEnv();

	if (LICENSE_KEY) {
		return {
			source: 'env',
			key: LICENSE_KEY,
		};
	}

	const schema = await getSchema(options);
	const settingsService = new SettingsService({ schema, ...options });

	const { license_key } = await settingsService.readSingleton({ fields: ['license_key'] });

	return {
		source: license_key ? 'settings' : null,
		key: license_key ?? null,
	};
}
