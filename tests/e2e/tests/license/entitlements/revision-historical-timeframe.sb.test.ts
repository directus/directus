import { activateLicense, CORE_LICENSE, deactivateLicense } from '@directus/license';
import { createLicense, mockClient } from '@directus/mock-license-server';
import { sandbox, type Sandbox } from '@directus/sandbox';
import { createDirectus, type DirectusClient, readRevisions, rest, type RestClient, staticToken } from '@directus/sdk';
import { database } from '@utils/constants.js';
import { getHelpers } from '@utils/db-helpers/index.js';
import { getUID } from '@utils/getUID.js';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createSandboxOptions } from '../shared.js';

const DAY_IN_SECONDS = 24 * 60 * 60;
const TIMEFRAME_DAYS = CORE_LICENSE.entitlements.revision_historical_timeframe.limit / DAY_IN_SECONDS;

const unlimitedLicense = createLicense({
	meta: { name: 'unlimited-activity' },
	entitlements: { revision_historical_timeframe: { limit: -1 } },
});

type Label = 'within' | 'boundary' | 'outside';

const SEED_PLAN: Array<{ label: Label; daysAgo: number }> = [
	{ label: 'within', daysAgo: 1 },
	{ label: 'boundary', daysAgo: TIMEFRAME_DAYS - 1 },
	{ label: 'outside', daysAgo: 60 },
];

describe('revision_historical_timeframe', () => {
	let directus: Sandbox;
	let api: DirectusClient<unknown> & RestClient<unknown>;

	beforeAll(async () => {
		directus = await sandbox(
			database,
			createSandboxOptions({
				extras: { license: true },
				knex: true,
				hooks: {
					beforeApi: async ({ env }) => {
						const base = `http://localhost:${env.LICENSE_PORT}`;
						await mockClient.registerLicense(base, unlimitedLicense);
					},
				},
			}),
		);

		api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));

		// seed activity data for the test scenarios
		for (const { label, daysAgo } of SEED_PLAN) {
			// writeTimestamp is the INSERT-side helper (returns a Date with
			// per-dialect TZ adjustment); core uses it for date-created /
			// date-updated. parse() returns an ISO string with `T`/`Z`, which
			// is fine for WHERE comparisons but MySQL/MariaDB reject it in
			// strict mode on DATETIME column bindings.
			const timestamp = getHelpers(directus.knex!).date.writeTimestamp(
				new Date(Date.now() - daysAgo * DAY_IN_SECONDS * 1000).toISOString(),
			);

			for (let i = 0; i < 5; i++) {
				const collection = getUID();

				await directus.knex!('directus_activity').insert({
					action: 'create',
					user: null,
					timestamp,
					collection,
					item: label,
				});

				// get last inserted id, workaround for returning not db agnostic
				const record = await directus.knex!('directus_activity').max('id', { as: 'id' }).first();

				await directus.knex!('directus_revisions').insert({
					activity: record?.['id'] as number,
					collection,
					item: label,
				});
			}
		}
	});

	afterAll(async () => {
		await directus?.stop();
	});

	// no license activated: exercises the CORE_LICENSE default timeframe
	describe(`revision_historical_timeframe=${TIMEFRAME_DAYS}d`, () => {
		test('GET /activity excludes rows older than the timeframe', async () => {
			const rows = await api.request(readRevisions({ limit: -1 }));

			expect(rows.filter((r) => ['within', 'boundary', 'outside'].includes(r['item']))).toHaveLength(10);
		});
	});

	describe('revision_historical_timeframe=-1', () => {
		beforeAll(async () => {
			await api.request(activateLicense({ license_key: unlimitedLicense.key }));
		});

		afterAll(async () => {
			await api.request(deactivateLicense());
		});

		test('GET /activity returns rows of any age', async () => {
			const rows = await api.request(readRevisions({ limit: -1 }));

			expect(rows.filter((r) => ['within', 'boundary', 'outside'].includes(r['item']))).toHaveLength(15);
		});
	});
});
