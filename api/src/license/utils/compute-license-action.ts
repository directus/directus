export type LicenseCredentials = {
	envKey?: string | null | undefined;
	envToken?: string | null | undefined;
	dbKey?: string | null | undefined;
	dbToken?: string | null | undefined;
};

export type LicenseAction =
	| { kind: 'fatal'; message: string }
	| { kind: 'activate'; key: string }
	| { kind: 'update'; currentKey: string; key: string }
	/** `key` is `null` for an offline token, which carries none to refresh with */
	| { kind: 'refresh'; key: string | null; token: string }
	| { kind: 'clear-token' }
	| { kind: 'sync' };

/**
 * Determine the license action to take
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
 * |   n    |    n     |       n       |    y    | clear-token - orphaned token, drop to core  | H  |
 * |   n    |    n     |       n       |    n    | sync - already core, just propagate         | I  |
 */
export function computeLicenseAction({ envKey, envToken, dbKey, dbToken }: LicenseCredentials): LicenseAction {
	// CASE A
	if (envKey && envToken) {
		return { kind: 'fatal', message: 'LICENSE_KEY and LICENSE_TOKEN cannot both be set' };
	}

	if (envKey) {
		// CASE B
		if (dbKey && envKey !== dbKey) {
			return { kind: 'update', currentKey: dbKey, key: envKey };
		}

		// CASE C
		if (dbKey && dbToken) {
			return { kind: 'refresh', key: envKey, token: dbToken };
		}

		// CASE D
		return { kind: 'activate', key: envKey };
	}

	// CASE E
	if (envToken) {
		return { kind: 'refresh', key: null, token: envToken };
	}

	if (dbKey) {
		// CASE F
		if (dbToken) {
			return { kind: 'refresh', key: dbKey, token: dbToken };
		}

		// CASE G
		return { kind: 'activate', key: dbKey };
	}

	// CASE H
	if (dbToken) {
		return { kind: 'clear-token' };
	}

	// CASE I
	return { kind: 'sync' };
}
