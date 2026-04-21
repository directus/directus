import { InvalidLicenseTokenError } from '@directus/errors';
import type { Knex } from 'knex';
import {
	getLicensePayloadCacheTtl,
	readCacheTokenPayload,
	writeCacheTokenPayload,
} from '../utils/cache-token-payload.js';
import { verify, verifyLocallyWithinGrace } from '../utils/verify-token.js';
import { getEnvOfflinePayload } from './env.js';
import { getLicenseToken } from './storage.js';
import type { LicenseTokenPayload } from './types.js';

export async function getLicensePayload(knex?: Knex): Promise<LicenseTokenPayload | undefined> {
	return await getStoredLicensePayload('remote', knex);
}

export async function getLocalLicensePayload(knex?: Knex): Promise<LicenseTokenPayload | undefined> {
	return await getStoredLicensePayload('local', knex);
}

async function getStoredLicensePayload(
	mode: 'local' | 'remote',
	knex?: Knex,
): Promise<LicenseTokenPayload | undefined> {
	const cached = await readCacheTokenPayload();

	if (cached) {
		return cached as LicenseTokenPayload;
	}

	const envPayload = await getEnvOfflinePayload();

	if (envPayload) {
		await writeCacheTokenPayload(envPayload, getLicensePayloadCacheTtl(envPayload));
		return envPayload;
	}

	const rawToken = await getLicenseToken(knex);

	if (!rawToken) return undefined;

	try {
		const payload = await verify(rawToken, mode === 'local' ? { mode: 'local' } : undefined);
		await writeCacheTokenPayload(payload, getLicensePayloadCacheTtl(payload));
		return payload;
	} catch (error) {
		if (mode === 'local' && isExpiredClaimError(error)) {
			try {
				const payload = await verifyLocallyWithinGrace(rawToken);
				await writeCacheTokenPayload(payload, getLicensePayloadCacheTtl(payload));
				return payload;
			} catch (graceError) {
				if (graceError instanceof InvalidLicenseTokenError) {
					return undefined;
				}

				throw new InvalidLicenseTokenError({}, { cause: graceError });
			}
		}

		if (mode === 'local' && error instanceof InvalidLicenseTokenError) {
			return undefined;
		}

		throw new InvalidLicenseTokenError({}, { cause: error });
	}
}

function isExpiredClaimError(error: unknown): error is Error {
	return error instanceof Error && error.message.includes('"exp" claim timestamp check failed');
}
