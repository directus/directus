import { expect, test } from 'vitest';
import { computeBootAction, type LicenseBootAction, type LicenseBootState } from './compute-boot-action.js';

const EMPTY: LicenseBootState = { envKey: null, envToken: null, dbKey: null, dbToken: null };

const boot = (state: Partial<LicenseBootState>) => computeBootAction({ ...EMPTY, ...state });

test.each<[string, Partial<LicenseBootState>, LicenseBootAction]>([
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
		{ kind: 'update', source: 'env', currentKey: 'db-key', key: 'env-key' },
	],
	[
		'B — even with no persisted token',
		{ envKey: 'env-key', dbKey: 'db-key' },
		{ kind: 'update', source: 'env', currentKey: 'db-key', key: 'env-key' },
	],
	[
		'C — unchanged env key with a persisted token',
		{ envKey: 'shared-key', dbKey: 'shared-key', dbToken: 'db-token' },
		{ kind: 'refresh', source: 'env', key: 'shared-key', token: 'db-token' },
	],
	[
		'D — unchanged env key without a persisted token',
		{ envKey: 'shared-key', dbKey: 'shared-key' },
		{ kind: 'activate', source: 'env', key: 'shared-key' },
	],
	['D — env key with nothing persisted', { envKey: 'env-key' }, { kind: 'activate', source: 'env', key: 'env-key' }],
	[
		'D — env key with a token orphaned by a missing key',
		{ envKey: 'env-key', dbToken: 'orphan-token' },
		{ kind: 'activate', source: 'env', key: 'env-key' },
	],
	[
		'E — env token, whatever is persisted',
		{ envToken: 'env-token', dbKey: 'db-key', dbToken: 'db-token' },
		{ kind: 'refresh', source: 'env', key: null, token: 'env-token' },
	],
	[
		'E — env token with nothing persisted',
		{ envToken: 'env-token' },
		{ kind: 'refresh', source: 'env', key: null, token: 'env-token' },
	],
	[
		'E — env token with a persisted key alone',
		{ envToken: 'env-token', dbKey: 'db-key' },
		{ kind: 'refresh', source: 'env', key: null, token: 'env-token' },
	],
	[
		'E — env token with an orphaned persisted token',
		{ envToken: 'env-token', dbToken: 'db-token' },
		{ kind: 'refresh', source: 'env', key: null, token: 'env-token' },
	],
	[
		'F — persisted key and token',
		{ dbKey: 'db-key', dbToken: 'db-token' },
		{ kind: 'refresh', source: 'settings', key: 'db-key', token: 'db-token' },
	],
	['G — persisted key without a token', { dbKey: 'db-key' }, { kind: 'activate', source: 'settings', key: 'db-key' }],
	[
		'G — a token absent as null',
		{ dbKey: 'db-key', dbToken: null },
		{ kind: 'activate', source: 'settings', key: 'db-key' },
	],
	[
		'G — a token absent as an empty string',
		{ dbKey: 'db-key', dbToken: '' },
		{ kind: 'activate', source: 'settings', key: 'db-key' },
	],
	['H — orphaned persisted token', { dbToken: 'db-token' }, { kind: 'downgrade' }],
	['I — nothing configured', {}, { kind: 'sync', source: null }],
	[
		'I — every credential an empty string',
		{ envKey: '', envToken: '', dbKey: '', dbToken: '' },
		{ kind: 'sync', source: null },
	],
])('CASE %s', (_, state, expected) => {
	expect(boot(state)).toEqual(expected);
});
