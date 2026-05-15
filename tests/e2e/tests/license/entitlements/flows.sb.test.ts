import { randomUUID } from 'node:crypto';
import { createLicense } from '@directus/mock-license-server';
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
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';

const LIMIT = 3;

let createdFlows: string[] = [];

let directus: Sandbox;
let api: DirectusClient<any> & RestClient<any>;

const license = createLicense({
	meta: { name: 'flows-entitlement-test' },
	entitlements: {
		flows: { limit: LIMIT },
	},
});

async function createEmptyFlow(name: string, overrides?: NestedPartial<DirectusFlow<any>>) {
	return api.request(
		createFlow({
			name,
			trigger: 'manual',
			...(overrides ?? {}),
		}),
	);
}

async function fillFlowLimit(prefix: string) {
	for (let i = 1; i <= LIMIT; i++) {
		const name = prefix + '_flow_entitlement_' + i;

		const result = await createEmptyFlow(name);

		createdFlows.push(result['id'] as string);
	}
}

beforeAll(async () => {
	const devMode = process.env['NODE_ENV'] === 'development';

	directus = await sandbox(database, {
		dev: devMode,
		watch: devMode,
		prefix: database,
		env: {
			CACHE_SCHEMA: 'false',
			DB_FILENAME: `directus_test_${randomUUID()}.db`,
			LICENSE_KEY: license.key,
			DB_EXCLUDE_TABLES: 'secrets',
		},
		extras: {
			license: true,
		},
		cache: false,
		knex: true,
		hooks: {
			beforeApi: async ({ env }) => {
				// Register the license with the mock license server before the api boots so
				// directus picks it up via the LICENSE_KEY env var (avoids the activate path).
				await fetch(`http://localhost:${env.LICENSE_PORT}/admin/license`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(license),
				});
			},
		},
	});

	api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));
});

afterAll(async () => {
	await directus?.stop();
});

describe('flows entitlement', () => {
	afterEach(async () => {
		for (const id of createdFlows) {
			try {
				await api.request(deleteFlow(id));
			} catch {
				// ignore cleanup failures
			}
		}

		createdFlows = [];
	});

	test('can successfully create flows within the limit', async () => {
		await fillFlowLimit('a');

		const all = await api.request(
			readFlows({
				filter: { status: { _eq: 'active' } },
				limit: -1,
			}),
		);

		expect(all).toHaveLength(LIMIT);
	});

	test('creating a flow above the license limit rejects with LIMIT_EXCEEDED', async () => {
		await fillFlowLimit('b');

		const name = 'b_flow_entitlement_' + (LIMIT + 1);

		await expect(createEmptyFlow(name)).rejects.toMatchObject({
			errors: [
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: 'LIMIT_EXCEEDED',
					}),
				}),
			],
		});
	});

	test('creating an inactive flow above the license limit succeeds', async () => {
		await fillFlowLimit('c');

		const result = await createEmptyFlow('c_flow_entitlement_inactive', {
			status: 'inactive',
		});

		createdFlows.push(result['id'] as string);

		expect(result).toBeDefined();
	});

	test('deactivating an existing flow allows new creation', async () => {
		await fillFlowLimit('d');

		await api.request(
			updateFlow(createdFlows[0]!, {
				status: 'inactive',
			}),
		);

		const name = 'd_flow_entitlement_' + (LIMIT + 1);

		const result = await createEmptyFlow(name);

		createdFlows.push(result['id'] as string);

		expect(result).toBeDefined();
	});

	test('can deactivate an existing flow remaining over the limit', async () => {
		await fillFlowLimit('e');

		// seed 2 flows directly via knex to push the active count over the license limit
		const extra1 = randomUUID();
		const extra2 = randomUUID();

		await directus.knex!('directus_flows').insert({
			id: extra1,
			name: 'e_flow_entitlement_extra_1',
			status: 'active',
			trigger: 'manual',
		});

		await directus.knex!('directus_flows').insert({
			id: extra2,
			name: 'e_flow_entitlement_extra_2',
			status: 'active',
			trigger: 'manual',
		});

		createdFlows.push(extra1);
		createdFlows.push(extra2);

		// deactivating should remain allowed even though total active is over the limit
		await expect(
			api.request(
				updateFlow(createdFlows[0]!, {
					status: 'inactive',
				}),
			),
		).resolves.toBeDefined();
	});
});
