import { randomUUID } from 'node:crypto';
import { activateLicense, deactivateLicense } from '@directus/license';
import { createLicense, mockClient } from '@directus/mock-license-server';
import { sandbox, type Sandbox } from '@directus/sandbox';
import {
	createDirectus,
	createFlow,
	deleteFlow,
	type DirectusClient,
	type DirectusFlow,
	type NestedPartial,
	readFlows,
	rest,
	type RestClient,
	staticToken,
	updateFlow,
} from '@directus/sdk';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';
import { createSandboxOptions } from '../shared.js';

const DEFAULT_LIMIT = 3;

const restrictedLicense = createLicense({
	meta: { name: 'flows-restricted' },
	entitlements: { flows: { limit: DEFAULT_LIMIT } },
});

function buildFlow(name: string, overrides?: NestedPartial<DirectusFlow<any>>) {
	return {
		name: `${getUID()}_${name}`,
		trigger: 'manual',
		...(overrides ?? {}),
	};
}

async function seedFlowsToLimit(api: DirectusClient<unknown> & RestClient<unknown>, limit?: number) {
	for (let i = 1; i <= (limit || DEFAULT_LIMIT); i++) {
		await api.request(createFlow(buildFlow(String(i))));
	}
}

describe('flows', () => {
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
						await mockClient.registerLicense(base, restrictedLicense);
					},
				},
			}),
		);

		api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));
	});

	afterAll(async () => {
		await directus?.stop();
	});

	afterEach(async () => {
		const flows = await api.request(readFlows({ limit: -1 }));

		for (const { id, name } of flows) {
			if (name.includes(getUID()) === false) {
				continue;
			}

			try {
				await api.request(deleteFlow(id));
			} catch {
				// ignore cleanup failures
			}
		}
	});

	describe('flows=3', () => {
		beforeAll(async () => {
			await api.request(activateLicense({ license_key: restrictedLicense.key }));
		});

		afterAll(async () => {
			await api.request(deactivateLicense());
		});

		test('creating flows within the limit succeeds', async () => {
			await expect(seedFlowsToLimit(api)).resolves.not.toThrow();
		});

		test('creating a flow above the limit rejects with LIMIT_EXCEEDED', async () => {
			await seedFlowsToLimit(api);

			await expect(api.request(createFlow(buildFlow(String(DEFAULT_LIMIT + 1))))).rejects.toMatchObject({
				errors: [
					expect.objectContaining({
						extensions: expect.objectContaining({ code: 'LIMIT_EXCEEDED' }),
					}),
				],
			});
		});

		test('creating an inactive flow when above the limit succeeds', async () => {
			await seedFlowsToLimit(api);

			await expect(api.request(createFlow(buildFlow('inactive', { status: 'inactive' })))).resolves.toBeDefined();
		});

		test('updating an existing flow to inactive reduces the limit', async () => {
			await seedFlowsToLimit(api);

			const [first] = await api.request(readFlows({ filter: { name: { _eq: `${getUID()}_1` } }, limit: 1 }));

			await api.request(updateFlow(first!.id, { status: 'inactive' }));

			await expect(api.request(createFlow(buildFlow('new')))).resolves.toBeDefined();
		});

		test('updating an existing flow to inactive while over the limit succeeds', async () => {
			await seedFlowsToLimit(api);

			// Seed two extra active flows directly via knex to push count over the limit.
			for (const suffix of ['extra_1', 'extra_2']) {
				await directus.knex!('directus_flows').insert({
					id: randomUUID(),
					name: `${getUID()}_${suffix}`,
					status: 'active',
					trigger: 'manual',
				});
			}

			const [first] = await api.request(readFlows({ filter: { name: { _eq: `${getUID()}_1` } }, limit: 1 }));

			await expect(api.request(updateFlow(first!.id, { status: 'inactive' }))).resolves.toBeDefined();
		});

		test('activating a flow when above the limit rejects with LIMIT_EXCEEDED', async () => {
			await seedFlowsToLimit(api);

			// Seed two inactive flows over the limit, then attempt to reactivate one.
			const targetId = randomUUID();

			await directus.knex!('directus_flows').insert({
				id: targetId,
				name: `${getUID()}_entitlement_extra_1`,
				status: 'inactive',
				trigger: 'manual',
			});

			await directus.knex!('directus_flows').insert({
				id: randomUUID(),
				name: `${getUID()}_entitlement_extra_2`,
				status: 'inactive',
				trigger: 'manual',
			});

			await expect(api.request(updateFlow(targetId, { status: 'active' }))).rejects.toMatchObject({
				errors: [
					expect.objectContaining({
						extensions: expect.objectContaining({ code: 'LIMIT_EXCEEDED' }),
					}),
				],
			});
		});
	});
});
