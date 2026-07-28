import { randomUUID } from 'node:crypto';
import { sandbox, type Sandbox } from '@directus/sandbox';
import { database } from '@utils/constants.js';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

const NETLIFY_SECRET = 'netlify-secret';
const SHARED_EXTERNAL_ID = 'shared-site-id';

const NETLIFY_DEPLOYMENT = randomUUID();
const VERCEL_DEPLOYMENT = randomUUID();

let directus: Sandbox;
let baseUrl: string;

beforeAll(async () => {
	const devMode = process.env['NODE_ENV'] === 'development';

	directus = await sandbox(database, {
		dev: devMode,
		watch: devMode,
		prefix: database,
		docker: { keep: devMode },
		cache: false,
		knex: true,
		env: {
			CACHE_SCHEMA: 'false',
			DB_FILENAME: `directus_test_${randomUUID()}.db`,
		},
	});

	baseUrl = `http://localhost:${directus.apis[0].port}`;

	const knex = directus.knex!;

	await knex('directus_deployments').insert([
		{
			id: NETLIFY_DEPLOYMENT,
			provider: 'netlify',
			credentials: JSON.stringify({ access_token: 'token' }),
			options: '{}',
			webhook_secret: NETLIFY_SECRET,
		},
		{
			id: VERCEL_DEPLOYMENT,
			provider: 'vercel',
			credentials: JSON.stringify({ access_token: 'token' }),
			options: '{}',
		},
	]);

	await knex('directus_deployment_projects').insert({
		id: randomUUID(),
		deployment: VERCEL_DEPLOYMENT,
		external_id: SHARED_EXTERNAL_ID,
		name: 'Vercel project',
	});
});

afterAll(async () => {
	await directus?.stop();
});

describe('deployment webhook project scoping', () => {
	test('returns 410 instead of resolving a project tracked under a different provider', async () => {
		const body = JSON.stringify({
			id: randomUUID(),
			site_id: SHARED_EXTERNAL_ID,
			state: 'ready',
			published_at: '2026-01-01T00:00:00.000Z',
		});

		const response = await fetch(`${baseUrl}/deployments/webhooks/netlify?token=${NETLIFY_SECRET}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body,
		});

		expect(response.status, 'unscoped lookup would resolve the Vercel project and return 200').toBe(410);
	});
});
