import { activateLicense, deactivateLicense } from '@directus/license';
import { createLicense, mockClient } from '@directus/mock-license-server';
import { sandbox, type Sandbox } from '@directus/sandbox';
import { createDirectus, type DirectusClient, readActivities, rest, type RestClient, staticToken } from '@directus/sdk';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createSandboxOptions } from '../shared.js';

const DAY_IN_SECONDS = 24 * 60 * 60;
const TIMEFRAME_DAYS = 7;

const restrictedLicense = createLicense({
	meta: { name: 'restricted-activity' },
	entitlements: { activity_historical_timeframe: { limit: TIMEFRAME_DAYS * DAY_IN_SECONDS } },
});

const unlimitedLicense = createLicense({
	meta: { name: 'unlimited-activity' },
	entitlements: { activity_historical_timeframe: { limit: -1 } },
});

type Label = 'within' | 'boundary' | 'outside';

const SEED_PLAN: Array<{ label: Label; daysAgo: number }> = [
	{ label: 'within', daysAgo: 1 },
	{ label: 'boundary', daysAgo: TIMEFRAME_DAYS - 1 },
	{ label: 'outside', daysAgo: 30 },
];

describe('activity_historical_timeframe', () => {
	let directus: Sandbox;
	let api: DirectusClient<any> & RestClient<any>;

	beforeAll(async () => {
		directus = await sandbox(
			database,
			createSandboxOptions({
				extras: { license: true },
				knex: true,
				hooks: {
					beforeApi: async ({ env }) => {
						const base = `http://localhost:${env.LICENSE_PORT}`;
						mockClient.registerLicense(base, restrictedLicense);
						mockClient.registerLicense(base, unlimitedLicense);
					},
				},
			}),
		);

		api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));

		// seed activity data for the test scenarios
		for (const { label, daysAgo } of SEED_PLAN) {
			const timestamp = new Date(Date.now() - daysAgo * DAY_IN_SECONDS * 1000).toISOString();

			for (let i = 0; i < 5; i++) {
				await directus.knex!('directus_activity').insert({
					action: 'create',
					user: null,
					timestamp,
					collection: getUID(),
					item: label,
				});
			}
		}
	});

	afterAll(async () => {
		await directus?.stop();
	});

	describe('activity_historical_timeframe=7d', () => {
		beforeAll(async () => {
			await api.request(activateLicense({ license_key: restrictedLicense.key }));
		});

		afterAll(async () => {
			await api.request(deactivateLicense());
		});

		test('GET /activity excludes rows older than the timeframe', async () => {
			const rows = await api.request(readActivities({ limit: -1 }));

			expect(rows.filter((r) => ['within', 'boundary', 'outside'].includes(r['item']))).toHaveLength(10);
		});
	});

	describe('activity_historical_timeframe=-1', () => {
		beforeAll(async () => {
			await api.request(activateLicense({ license_key: unlimitedLicense.key }));
		});

		afterAll(async () => {
			await api.request(deactivateLicense());
		});

		test('GET /activity returns rows of any age', async () => {
			const rows = await api.request(readActivities({ limit: -1 }));

			expect(rows.filter((r) => ['within', 'boundary', 'outside'].includes(r['item']))).toHaveLength(15);
		});
	});
});
