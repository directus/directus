import { randomUUID } from 'node:crypto';
import { LICENSE_API_VERSION } from '@directus/license';
import { createLicense } from '@directus/mock-license-server';
import type { Options } from '@directus/sandbox';
import type { DeepPartial } from '@directus/types';
import { database } from '@utils/constants.js';
import { merge } from 'lodash-es';

export const devMode = process.env['NODE_ENV'] === 'development';

export type License = ReturnType<typeof createLicense>;

export async function registerLicense(licensePort: string | number, license: License) {
	await fetch(`http://localhost:${licensePort}/admin/license`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(license),
	});
}

export async function mocActivateKey(
	licensePort: string | number,
	body: { license_key: string; project_id: string; public_url: string },
): Promise<{ token: string; new_project_id?: string }> {
	const res = await fetch(`http://localhost:${licensePort}/api/licenses/activate`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Directus-License-Version': LICENSE_API_VERSION,
		},
		body: JSON.stringify(body),
	});

	if (!res.ok) {
		throw new Error(`Mock activate failed: ${res.status} ${await res.text()}`);
	}

	return (await res.json()) as { token: string; new_project_id?: string };
}

export function createSandboxOptions(overrides?: DeepPartial<Options>): DeepPartial<Options> {
	return merge(
		{
			dev: devMode,
			watch: devMode,
			prefix: database,
			docker: { keep: devMode },
			extras: { license: true },
			cache: false,
			knex: true,
			env: {
				CACHE_SCHEMA: 'false',
				DB_FILENAME: `directus_test_${randomUUID()}.db`,
			},
		},
		overrides,
	);
}
