import { randomUUID } from 'node:crypto';
import { type LicenseStatus, readLicense } from '@directus/license';
import { createLicense, mockClient } from '@directus/mock-license-server';
import { type Options, type Sandbox, sandbox } from '@directus/sandbox';
import { createDirectus, type DirectusClient, rest, type RestClient, staticToken } from '@directus/sdk';
import { database } from '@utils/constants.js';
import type { Knex } from 'knex';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createSandboxOptions } from './shared.js';

const now = () => Math.floor(Date.now() / 1000);

// Mirrors api/src/license/utils/get-core-grace-period.ts
const V12_MIGRATION_VERSION = '20260507A';

type LicenseOverrides = Parameters<typeof createLicense>[0];
type BeforeApiHook = NonNullable<Options['hooks']['beforeApi']>;

describe('paid license lifecycle at boot', () => {
	const cases: Array<{ name: string; overrides: LicenseOverrides; status: LicenseStatus }> = [
		{
			name: 'locked — seat entitlement violated',
			overrides: { meta: { name: 'lifecycle-locked' }, entitlements: { seats: { limit: 0 } } },
			status: 'locked',
		},
		{
			name: 'grace — expires_at past, within grace_period',
			overrides: { meta: { name: 'lifecycle-grace', expires_at: now() - 100, grace_period: 10_000 } },
			status: 'grace',
		},
	];

	describe.each(cases)('$name', ({ overrides, status }) => {
		const license = createLicense(overrides);

		let directus: Sandbox;
		let api: DirectusClient<any> & RestClient<any>;

		beforeAll(async () => {
			directus = await sandbox(
				database,
				createSandboxOptions({
					env: { LICENSE_KEY: license.key },
					hooks: {
						beforeApi: async ({ env }) => {
							await mockClient.registerLicense(env.LICENSE_API_URL!, license);
						},
					},
					knex: true,
					extras: {
						license: true,
					},
				}),
			);

			api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));
		});

		afterAll(async () => {
			await directus?.stop();
		});

		test(`reports ${status} status`, async () => {
			const info = await api.request(readLicense());
			expect(info.status).toEqual(status);
		});
	});
});

describe('core license lifecycle at boot', () => {
	// Simulate upgrade: oldest non-V12 migration timestamped > 1 day before V12
	const backdateOldestMigration = async (knex: Knex) => {
		const oldest = await knex!('directus_migrations')
			.whereNot('version', V12_MIGRATION_VERSION)
			.orderBy('timestamp', 'asc')
			.first();

		const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

		await knex!('directus_migrations').update({ timestamp: twoDaysAgo }).where({ version: oldest!.version });
	};

	const insertSurplusFlows = async (knex: Knex) => {
		await knex!('directus_flows').insert(
			Array.from({ length: 6 }, (_, i) => ({
				id: randomUUID(),
				name: `core-locked-flow-${i}`,
			})),
		);
	};

	const cases: Array<{ name: string; status: LicenseStatus; beforeApi?: BeforeApiHook }> = [
		{ name: 'active — clean install, no license', status: 'active' },
		{
			name: 'grace — upgrade within 30 days and within limits',
			status: 'active',
			async beforeApi({ knex }) {
				await backdateOldestMigration(knex as Knex);
			},
		},
		{
			name: 'grace — upgrade within 30 days and over limits',
			status: 'grace',
			async beforeApi({ knex }) {
				await backdateOldestMigration(knex as Knex);
				await insertSurplusFlows(knex as Knex);
			},
		},
		{
			name: 'locked — flow entitlement violated',
			status: 'locked',
			async beforeApi({ knex }) {
				await insertSurplusFlows(knex as Knex);
			},
		},
	];

	describe.each(cases)('$name', ({ status, beforeApi }) => {
		let directus: Sandbox;
		let api: DirectusClient<any> & RestClient<any>;

		beforeAll(async () => {
			directus = await sandbox(
				database,
				createSandboxOptions({ hooks: { beforeApi }, knex: true, extras: { license: true } }),
			);

			api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));
		});

		afterAll(async () => {
			await directus?.stop();
		});

		test(`reports ${status} status on core license`, async () => {
			const info = await api.request(readLicense());
			expect(info.status).toEqual(status);
		});
	});
});
