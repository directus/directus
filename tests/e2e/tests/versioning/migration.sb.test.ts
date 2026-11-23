import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { apiFolder, type Env, type Sandbox } from '@directus/sandbox';
import { database } from '@utils/constants.js';
import { sandboxPort } from '@utils/sandbox-port.js';
import { useSandbox } from '@utils/sandbox.js';
import { afterAll, beforeAll, expect, test } from 'vitest';

const MIGRATION = '20261106A';

let directus: Sandbox;

beforeAll(async () => {
	directus = await useSandbox(database, {
		port: sandboxPort(),
		prefix: 'versioning-migration',
		inspect: false,
		knex: true,
	});
});

afterAll(async () => {
	await directus?.stop();
});

function migrateLatest(env: Env) {
	const migrate = spawn('node', [join(apiFolder, 'dist', 'cli', 'run.js'), 'database', 'migrate:latest'], { env });

	let output = '';

	migrate.stdout.on('data', (data) => (output += data));
	migrate.stderr.on('data', (data) => (output += data));

	return new Promise<{ code: number | null; output: string }>((resolve) =>
		migrate.on('close', (code) => resolve({ code, output })),
	);
}

test('collections versioned before the upgrade with a conflicting field name fail the migration', async () => {
	const knex = directus.knex!;

	// The state of a project that versioned collections before version tables existed
	await knex.schema.createTable('legacy', (table) => {
		table.increments('id');
		table.string('version_id');
	});

	await knex.schema.createTable('pages', (table) => {
		table.increments('id');
		table.string('title');
	});

	await knex('directus_collections').insert([
		{ collection: 'legacy', versioning: true },
		{ collection: 'pages', versioning: true },
	]);

	await knex('directus_migrations').where({ version: MIGRATION }).delete();

	const { code, output } = await migrateLatest(directus.env);

	expect(code, output).not.toBe(0);
	expect(output).toContain('conflicts with a reserved versioning field name');
	expect(await knex('directus_migrations').where({ version: MIGRATION }).first()).toBeUndefined();
});
