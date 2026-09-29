import { expect, test } from 'vitest';
import { computeLicenseAction, type LicenseAction, type LicenseCredentials } from './compute-license-action.js';

const EMPTY: LicenseCredentials = { envKey: null, envToken: null, dbKey: null, dbToken: null };

const compute = (credentials: Partial<LicenseCredentials>) => computeLicenseAction({ ...EMPTY, ...credentials });

test.each<[string, Partial<LicenseCredentials>, LicenseAction]>([
	[
		'A — both env vars set',
		{ envKey: 'env-key', envToken: 'env-token', dbKey: 'db-key', dbToken: 'db-token' },
		{ kind: 'fatal', message: 'LICENSE_KEY and LICENSE_TOKEN cannot both be set' },
	],
	[
		'A — both env vars set with nothing persisted',
		{ envKey: 'env-key', envToken: 'env-token' },
		{ kind: 'fatal', message: 'LICENSE_KEY and LICENSE_TOKEN cannot both be set' },
	],
	[
		'B — env key replaces the persisted one',
		{ envKey: 'env-key', dbKey: 'db-key', dbToken: 'db-token' },
		{ kind: 'update', currentKey: 'db-key', key: 'env-key' },
	],
	[
		'B — even with no persisted token',
		{ envKey: 'env-key', dbKey: 'db-key' },
		{ kind: 'update', currentKey: 'db-key', key: 'env-key' },
	],
	[
		'C — unchanged env key with a persisted token',
		{ envKey: 'shared-key', dbKey: 'shared-key', dbToken: 'db-token' },
		{ kind: 'refresh', key: 'shared-key', token: 'db-token' },
	],
	[
		'D — unchanged env key without a persisted token',
		{ envKey: 'shared-key', dbKey: 'shared-key' },
		{ kind: 'activate', key: 'shared-key' },
	],
	['D — env key with nothing persisted', { envKey: 'env-key' }, { kind: 'activate', key: 'env-key' }],
	[
		'D — env key with a token orphaned by a missing key',
		{ envKey: 'env-key', dbToken: 'orphan-token' },
		{ kind: 'activate', key: 'env-key' },
	],
	[
		'E — env token, whatever is persisted',
		{ envToken: 'env-token', dbKey: 'db-key', dbToken: 'db-token' },
		{ kind: 'refresh', key: null, token: 'env-token' },
	],
	[
		'E — env token with nothing persisted',
		{ envToken: 'env-token' },
		{ kind: 'refresh', key: null, token: 'env-token' },
	],
	[
		'E — env token with a persisted key alone',
		{ envToken: 'env-token', dbKey: 'db-key' },
		{ kind: 'refresh', key: null, token: 'env-token' },
	],
	[
		'E — env token with an orphaned persisted token',
		{ envToken: 'env-token', dbToken: 'db-token' },
		{ kind: 'refresh', key: null, token: 'env-token' },
	],
	[
		'F — persisted key and token',
		{ dbKey: 'db-key', dbToken: 'db-token' },
		{ kind: 'refresh', key: 'db-key', token: 'db-token' },
	],
	['G — persisted key without a token', { dbKey: 'db-key' }, { kind: 'activate', key: 'db-key' }],
	['G — a token absent as null', { dbKey: 'db-key', dbToken: null }, { kind: 'activate', key: 'db-key' }],
	['G — a token absent as an empty string', { dbKey: 'db-key', dbToken: '' }, { kind: 'activate', key: 'db-key' }],
	['H — orphaned persisted token', { dbToken: 'db-token' }, { kind: 'clear-token' }],
	['I — nothing configured', {}, { kind: 'sync' }],
	['I — every credential an empty string', { envKey: '', envToken: '', dbKey: '', dbToken: '' }, { kind: 'sync' }],
])('CASE %s', (_, credentials, expected) => {
	expect(compute(credentials)).toEqual(expected);
});
