import { randomUUID } from 'node:crypto';
import { sandbox, type Sandbox } from '@directus/sandbox';
import {
	createDirectus,
	createPermission,
	createPermissions,
	createPolicy,
	deletePolicy,
	type DirectusClient,
	readActivities,
	readPermissions,
	readRevisions,
	readSettings,
	rest,
	type RestClient,
	staticToken,
	updateSettings,
} from '@directus/sdk';
import { database } from '@utils/constants.js';
import { getHelpers } from '@utils/db-helpers/index.js';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { LICENSE_KEYS } from './__fixtures__/licenses.js';
import { withDefaultSandboxOptions } from './__fixtures__/sandbox.js';

const DAY_SEC = 24 * 60 * 60;
const PUBLIC_POLICY_ID = 'abf8a154-5b1c-4a46-ac9c-7300570f4f17';
// LICENSE_KEYS.TINY sets both activity/revision timeframes to 7 days.
const TIMEFRAME_DAYS = 7;

// Records straddling the cutoff: just inside (6d) must be kept, just outside (8d) must be dropped.
const TIMEFRAME_SEED = [
	{ item: 'within', daysAgo: 1 },
	{ item: 'edge_in', daysAgo: TIMEFRAME_DAYS - 1 },
	{ item: 'edge_out', daysAgo: TIMEFRAME_DAYS + 1 },
	{ item: 'outside', daysAgo: 60 },
] as const;

const TIMEFRAME_KEPT = ['edge_in', 'within'];

function daysAgoTimestamp(daysAgo: number) {
	return getHelpers(directus.knex!).date.writeTimestamp(new Date(Date.now() - daysAgo * DAY_SEC * 1000).toISOString());
}

let directus: Sandbox;
let api: DirectusClient<any> & RestClient<any>;

beforeAll(async () => {
	directus = await sandbox(
		database,
		withDefaultSandboxOptions({
			env: { LICENSE_KEY: LICENSE_KEYS.TINY },
			extras: { license: true },
			knex: true,
		}),
	);

	api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));
});

afterAll(async () => {
	await directus?.stop();
});

describe('entitlements gate restrictions', () => {
	describe('custom_llms_enabled (default=false)', () => {
		test('PATCH /settings setting an LLM field rejects with RESOURCE_RESTRICTED', async () => {
			await expect(api.request(updateSettings({ ai_openai_compatible_name: 'test' } as any))).rejects.toMatchObject({
				errors: [
					expect.objectContaining({
						extensions: expect.objectContaining({ code: 'RESOURCE_RESTRICTED', category: 'custom_llms_enabled' }),
					}),
				],
			});
		});

		test('PATCH /settings with mixed allowed + LLM fields rejects with RESOURCE_RESTRICTED', async () => {
			const name = `project_${randomUUID()}`;

			try {
				await expect(
					api.request(updateSettings({ project_name: name, ai_openai_compatible_api_key: 'sk-test' } as any)),
				).rejects.toMatchObject({
					errors: [
						expect.objectContaining({
							extensions: expect.objectContaining({ code: 'RESOURCE_RESTRICTED', category: 'custom_llms_enabled' }),
						}),
					],
				});
			} finally {
				await directus.knex!('directus_settings')
					.update({ project_name: 'Directus' })
					.catch(() => {});
			}
		});

		test('PATCH /settings with a non-LLM field succeeds', async () => {
			const name = `project_${randomUUID()}`;

			try {
				const settings = await api.request(updateSettings({ project_name: name } as any));
				expect((settings as any)['project_name']).toBe(name);
			} finally {
				await directus.knex!('directus_settings')
					.update({ project_name: 'Directus' })
					.catch(() => {});
			}
		});

		test('GET /settings strips LLM fields', async () => {
			await directus.knex!('directus_settings').update({ ai_openai_compatible_name: 'leaked' });

			try {
				const settings = await api.request(readSettings());

				expect(settings['ai_openai_compatible_name']).toBeNull();
			} finally {
				// Reset directly via knex (the API blocks the field).
				await directus.knex!('directus_settings')
					.update({ ai_openai_compatible_name: null })
					.catch(() => {});
			}
		});
	});

	describe('custom_permission_rules_enabled (default=false)', () => {
		test('creating a custom permission rejects with RESOURCE_RESTRICTED', async () => {
			const policy = await api.request(createPolicy({ name: 'ent-custom-rule' }));

			try {
				await expect(
					api.request(
						createPermission({
							action: 'read',
							collection: 'articles',
							policy: policy['id'],
							fields: ['first_name'],
						}),
					),
				).rejects.toMatchObject({
					errors: [
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: 'RESOURCE_RESTRICTED',
								category: 'custom_permission_rules_enabled',
							}),
						}),
					],
				});
			} finally {
				await api.request(deletePolicy(policy['id'] as string)).catch(() => {});
			}
		});

		test('creating a full permission rule does not get rejected', async () => {
			const policy = await api.request(createPolicy({ name: 'ent-custom-rule' }));

			try {
				await expect(
					api.request(
						createPermission({
							action: 'read',
							collection: 'directus_users',
							policy: policy['id'],
							fields: ['*'],
						}),
					),
				).resolves.toBeDefined();
			} finally {
				await api.request(deletePolicy(policy['id'] as string)).catch(() => {});
			}
		});

		test('batch create with mixed allowed + custom rows rejects with RESOURCE_RESTRICTED', async () => {
			const policy = await api.request(createPolicy({ name: 'ent-custom-rule-batch' }));

			try {
				await expect(
					api.request(
						createPermissions([
							{ action: 'read', collection: 'directus_users', policy: policy['id'], fields: ['*'] },
							{ action: 'read', collection: 'articles', policy: policy['id'], fields: ['first_name'] },
						] as any),
					),
				).rejects.toMatchObject({
					errors: [
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: 'RESOURCE_RESTRICTED',
								category: 'custom_permission_rules_enabled',
							}),
						}),
					],
				});
			} finally {
				await api.request(deletePolicy(policy['id'] as string)).catch(() => {});
			}
		});

		test('GET /permissions filters out custom rules', async () => {
			const tag = `articles_${randomUUID()}`;

			// Seed directly via knex — the API create guard would reject the custom row.
			await directus.knex!('directus_permissions').insert([
				{ collection: tag, action: 'read', fields: '*', policy: PUBLIC_POLICY_ID },
				{ collection: tag, action: 'read', fields: 'first_name', policy: PUBLIC_POLICY_ID },
			]);

			try {
				const rows = await api.request(readPermissions({ filter: { collection: { _eq: tag } }, limit: -1 }));

				expect(rows).toHaveLength(1);
				expect(rows[0]!['fields']).toEqual(['*']);
			} finally {
				await directus.knex!('directus_permissions')
					.where({ collection: tag })
					.delete()
					.catch(() => {});
			}
		});
	});

	describe('activity_historical_timeframe (limit=7d)', () => {
		test('GET /activity keeps rows up to the edge and excludes older ones', async () => {
			const tag = `activity_${randomUUID()}`;

			await directus.knex!('directus_activity').insert(
				TIMEFRAME_SEED.map(({ item, daysAgo }) => ({
					action: 'create',
					user: null,
					timestamp: daysAgoTimestamp(daysAgo),
					collection: tag,
					item,
				})),
			);

			try {
				const rows = await api.request(readActivities({ filter: { collection: { _eq: tag } }, limit: -1 }));

				expect(rows.map((r) => r['item']).sort()).toEqual(TIMEFRAME_KEPT);
			} finally {
				await directus.knex!('directus_activity')
					.where({ collection: tag })
					.delete()
					.catch(() => {});
			}
		});
	});

	describe('revision_historical_timeframe (limit=7d)', () => {
		test('GET /revisions keeps rows up to the edge and excludes older ones', async () => {
			const tag = `revision_${randomUUID()}`;

			for (const { item, daysAgo } of TIMEFRAME_SEED) {
				const [activity] = await directus.knex!('directus_activity').insert(
					{ action: 'create', user: null, timestamp: daysAgoTimestamp(daysAgo), collection: tag, item },
					['id'],
				);

				await directus.knex!('directus_revisions').insert({
					activity: activity?.id ?? activity,
					collection: tag,
					item,
					data: '{}',
					delta: '{}',
				});
			}

			try {
				const rows = await api.request(readRevisions({ filter: { collection: { _eq: tag } }, limit: -1 }));

				expect(rows.map((r) => r['item']).sort()).toEqual(TIMEFRAME_KEPT);
			} finally {
				await directus.knex!('directus_revisions')
					.where({ collection: tag })
					.delete()
					.catch(() => {});

				await directus.knex!('directus_activity')
					.where({ collection: tag })
					.delete()
					.catch(() => {});
			}
		});
	});
});
