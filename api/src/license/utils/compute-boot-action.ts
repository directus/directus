import type { LicenseSource } from '@directus/license';

export type LicenseBootState = {
	envKey?: string | null | undefined;
	envToken?: string | null | undefined;
	dbKey?: string | null | undefined;
	dbToken?: string | null | undefined;
};

type Source = Exclude<LicenseSource, null>;

export type LicenseBootAction =
	| { kind: 'fatal'; message: string }
	| { kind: 'activate'; source: Source; key: string }
	| { kind: 'update'; source: Source; currentKey: string; key: string }
	/** `key` is `null` for an offline token, which carries none to refresh with */
	| { kind: 'refresh'; source: Source; key: string | null; token: string }
	| { kind: 'downgrade' }
	| { kind: 'sync'; source: LicenseSource };

/**
 * Determine required license action at boot
 *
 * | envKey | envToken |     dbKey     | dbToken | Outcome                                     | id |
 * | ------ | -------- | ------------- | ------- | ------------------------------------------- | -- |
 * |   y    |    y     |       *       |    *    | fatal - neither env var can win             | A  |
 * |   y    |    n     | y (!= envKey) |    *    | update - env key replaces the persisted one | B  |
 * |   y    |    n     | y (== envKey) |    y    | refresh - revalidate the persisted token    | C  |
 * |   y    |    n     |       *       |    *    | activate - no token this key can use        | D  |
 * |   n    |    y     |       *       |    *    | refresh - offline token, persisted ignored  | E  |
 * |   n    |    n     |       y       |    y    | refresh - revalidate the persisted token    | F  |
 * |   n    |    n     |       y       |    n    | activate - no token to revalidate           | G  |
 * |   n    |    n     |       n       |    y    | downgrade - orphaned token, drop to core    | H  |
 * |   n    |    n     |       n       |    n    | sync - already core, just propagate         | I  |
 */
export function computeBootAction({ envKey, envToken, dbKey, dbToken }: LicenseBootState): LicenseBootAction {
	// CASE A
	if (envKey && envToken) {
		return { kind: 'fatal', message: 'LICENSE_KEY and LICENSE_TOKEN cannot both be set' };
	}

	if (envKey) {
		// CASE B
		if (dbKey && envKey !== dbKey) {
			return { kind: 'update', source: 'env', currentKey: dbKey, key: envKey };
		}

		// CASE C
		if (dbKey && dbToken) {
			return { kind: 'refresh', source: 'env', key: envKey, token: dbToken };
		}

		// CASE D
		return { kind: 'activate', source: 'env', key: envKey };
	}

	// CASE E
	if (envToken) {
		return { kind: 'refresh', source: 'env', key: null, token: envToken };
	}

	if (dbKey) {
		// CASE F
		if (dbToken) {
			return { kind: 'refresh', source: 'settings', key: dbKey, token: dbToken };
		}

		// CASE G
		return { kind: 'activate', source: 'settings', key: dbKey };
	}

	// CASE H
	if (dbToken) {
		return { kind: 'downgrade' };
	}

	// CASE I
	return { kind: 'sync', source: null };
}
