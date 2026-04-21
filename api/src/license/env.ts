import { useEnv } from '@directus/env';
import { InvalidLicenseConfigError, InvalidLicenseTokenError } from '@directus/errors';
import type { DirectusError } from '@directus/types';
import { verify } from '../utils/verify-token.js';
import { normalizeOptionalLicenseKey } from './license-context.js';
import type { EnvLicense, LicenseTokenPayload } from './types.js';

export function getEnvLicense(): EnvLicense {
	const env = useEnv();
	const key = normalizeOptionalLicenseKey(env['DIRECTUS_LICENSE_KEY']) ?? undefined;
	const rawToken = env['DIRECTUS_LICENSE_OFFLINE_TOKEN'];
	const token = typeof rawToken === 'string' ? rawToken.trim() || undefined : undefined;

	if (key && token) {
		throw new InvalidLicenseConfigError({
			reason: 'DIRECTUS_LICENSE_KEY and DIRECTUS_LICENSE_OFFLINE_TOKEN cannot both be set',
		});
	}

	if (token) {
		return {
			source: 'env',
			mode: 'env_offline',
			value: token,
		};
	}

	if (key) {
		return {
			source: 'env',
			mode: 'env_key',
			value: key,
		};
	}

	return {
		source: null,
		mode: null,
	};
}

export function isEnvOffline(env = getEnvLicense()): boolean {
	return env.mode === 'env_offline';
}

export async function getEnvOfflinePayload(): Promise<LicenseTokenPayload | undefined> {
	const env = getEnvLicense();

	if (env.mode !== 'env_offline' || !env.value) {
		return undefined;
	}

	const payload = await verifyEnvOfflineToken(env.value);
	return payload;
}

export function toEnvOfflineConfigError(error: unknown): DirectusError<{ reason: string }> {
	return new InvalidLicenseConfigError(
		{
			reason: 'DIRECTUS_LICENSE_OFFLINE_TOKEN is invalid or not offline-enabled',
		},
		error instanceof Error ? { cause: error } : undefined,
	);
}

async function verifyEnvOfflineToken(token: string): Promise<LicenseTokenPayload> {
	try {
		const payload = await verify(token, { mode: 'local' });

		if (payload.metadata.entitlements['offline_enabled'] !== true) {
			throw new InvalidLicenseTokenError({ reason: 'Token is not offline-enabled' });
		}

		if (payload.metadata.refresh_interval !== 0) {
			throw new InvalidLicenseTokenError({ reason: 'Token is not offline' });
		}

		return payload;
	} catch (error) {
		if (error instanceof InvalidLicenseTokenError) {
			throw error;
		}

		throw new InvalidLicenseTokenError({}, { cause: error });
	}
}
