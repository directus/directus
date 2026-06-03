import { randomUUID } from 'node:crypto';
import { sandbox, type Sandbox } from '@directus/sandbox';
import {
	createDirectus,
	createPermission,
	createPolicy,
	deletePermission,
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

let directus: Sandbox;
let api: DirectusClient<any> & RestClient<any>;

beforeAll(async () => {
	directus = await sandbox(
		database,
		withDefaultSandboxOptions({
			env: { LICENSE_KEY: LICENSE_KEYS.UNLIMITED },
			extras: { license: true },
			knex: true,
		}),
	);

	api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));
});

afterAll(async () => {
	await directus?.stop();
});

describe('entitlements unlimited', () => {
	describe('custom_llms_enabled', () => {
		test('PATCH /settings setting an LLM field succeeds', async () => {
			try {
				const settings = await api.request(updateSettings({ ai_openai_compatible_name: 'gpt-custom' } as any));
				expect((settings as any)['ai_openai_compatible_name']).toBe('gpt-custom');
			} finally {
				await directus.knex!('directus_settings')
					.update({ ai_openai_compatible_name: null })
					.catch(() => {});
			}
		});

		test('GET /settings does NOT strip LLM fields', async () => {
			await directus.knex!('directus_settings').update({ ai_openai_compatible_name: 'visible' });

			try {
				const settings = await api.request(readSettings());
				expect(settings['ai_openai_compatible_name']).toBe('visible');
			} finally {
				await directus.knex!('directus_settings')
					.update({ ai_openai_compatible_name: null })
					.catch(() => {});
			}
		});
	});

	describe('custom_permission_rules_enabled', () => {
		test('creating a custom permission succeeds', async () => {
			const policy = await api.request(createPolicy({ name: 'open-custom-rule' }));
			let permissionId;

			try {
				const permission = await api.request(
					createPermission({
						action: 'read',
						collection: 'articles',
						policy: policy['id'],
						fields: ['first_name'],
					}),
				);

				permissionId = permission['id'] as number;
				expect(permission).toBeDefined();
			} finally {
				if (permissionId) await api.request(deletePermission(permissionId)).catch(() => {});
				await api.request(deletePolicy(policy['id'] as string)).catch(() => {});
			}
		});

		test('GET /permissions returns custom rules', async () => {
			const collection = `articles_${randomUUID()}`;
			const policy = await api.request(createPolicy({ name: 'open-custom-rule-read' }));
			let permissionId;

			try {
				const permission = await api.request(
					createPermission({ action: 'read', collection, policy: policy['id'], fields: ['first_name'] }),
				);

				permissionId = permission['id'] as number;

				const rows = await api.request(readPermissions({ filter: { collection: { _eq: collection } }, limit: -1 }));

				expect(rows).toHaveLength(1);
				expect(rows[0]!['fields']).toEqual(['first_name']);
			} finally {
				if (permissionId) await api.request(deletePermission(permissionId)).catch(() => {});
				await api.request(deletePolicy(policy['id'] as string)).catch(() => {});
			}
		});
	});

	describe('activity_historical_timeframe', () => {
		test('GET /activity returns rows of any age', async () => {
			const tag = `activity_${randomUUID()}`;

			const within = getHelpers(directus.knex!).date.writeTimestamp(
				new Date(Date.now() - 1 * DAY_SEC * 1000).toISOString(),
			);

			const outside = getHelpers(directus.knex!).date.writeTimestamp(
				new Date(Date.now() - 60 * DAY_SEC * 1000).toISOString(),
			);

			await directus.knex!('directus_activity').insert([
				{ action: 'create', user: null, timestamp: within, collection: tag, item: 'within' },
				{ action: 'create', user: null, timestamp: outside, collection: tag, item: 'outside' },
			]);

			try {
				const rows = await api.request(readActivities({ filter: { collection: { _eq: tag } }, limit: -1 }));

				expect(rows.map((r) => r['item']).sort()).toEqual(['outside', 'within']);
			} finally {
				await directus.knex!('directus_activity')
					.where({ collection: tag })
					.delete()
					.catch(() => {});
			}
		});
	});

	describe('revision_historical_timeframe', () => {
		test('GET /revisions returns rows of any age', async () => {
			const tag = `revision_${randomUUID()}`;

			const within = getHelpers(directus.knex!).date.writeTimestamp(
				new Date(Date.now() - 1 * DAY_SEC * 1000).toISOString(),
			);

			const outside = getHelpers(directus.knex!).date.writeTimestamp(
				new Date(Date.now() - 60 * DAY_SEC * 1000).toISOString(),
			);

			const [activityWithin] = await directus.knex!('directus_activity').insert(
				{ action: 'create', user: null, timestamp: within, collection: tag, item: 'within' },
				['id'],
			);

			const [activityOutside] = await directus.knex!('directus_activity').insert(
				{ action: 'create', user: null, timestamp: outside, collection: tag, item: 'outside' },
				['id'],
			);

			await directus.knex!('directus_revisions').insert([
				{ activity: activityWithin?.id ?? activityWithin, collection: tag, item: 'within', data: '{}', delta: '{}' },
				{ activity: activityOutside?.id ?? activityOutside, collection: tag, item: 'outside', data: '{}', delta: '{}' },
			]);

			try {
				const rows = await api.request(readRevisions({ filter: { collection: { _eq: tag } }, limit: -1 }));

				expect(rows.map((r) => r['item']).sort()).toEqual(['outside', 'within']);
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
