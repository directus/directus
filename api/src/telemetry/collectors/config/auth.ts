import { toArray } from '@directus/utils';
import { getAuthProviders } from '../../../utils/get-auth-providers.js';
import { getConfigFromEnv } from '../../../utils/get-config-from-env.js';
import type { TelemetryReport } from '../../types/report.js';
import { detectIssuer } from '../../utils/detect-issuer.js';

export function collectAuthProviders(env: Record<string, unknown>): TelemetryReport['config']['auth'] {
	const configured = toArray(env['AUTH_PROVIDERS'] as string).map((name) => name.trim()).filter(Boolean);
	const resolvedProviders = getAuthProviders();
	const providerDrivers = new Map(resolvedProviders.map((provider) => [provider.name.toLowerCase(), provider.driver]));

	const drivers = new Set<string>();
	const issuers = new Set<string>();

	if (!env['AUTH_DISABLE_DEFAULT']) {
		drivers.add('local');
	}

	for (const name of configured) {
		const key = name.toLowerCase();
		const driver = providerDrivers.get(key) ?? getConfigFromEnv(`AUTH_${name.toUpperCase()}_`)['driver'];
		if (driver) drivers.add(String(driver));

		const issuer = detectIssuer(env, name, String(driver ?? ''));
		if (issuer) issuers.add(issuer);
	}

	return { providers: Array.from(drivers), issuers: Array.from(issuers) };
}
