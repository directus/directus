import type { TestProject } from 'vitest/node';
import { Database, sandbox, StopSandbox } from '@directus/sandbox';
import { createDirectus, rest, schemaApply, schemaDiff, staticToken } from '@directus/sdk';
import { Schema } from './schema';
import { join } from 'path';
import { readFile } from 'fs/promises';

let sb: StopSandbox | undefined;

export async function setup(project: TestProject) {
	const dev = Boolean(project.config.env['DEV']);
	const watch = Boolean(project.config.env['WATCH']);
	const database = project.config.env['DATABASE'] as Database;
	const port = project.config.env['PORT'];

	if (process.env['ALL'] !== 'true') {
		sb = await sandbox(database, {
			port,
			dev: true,
			watch: true,
			prefix: database,
			dockerBasePort: String(Number(project.config.env['PORT']) + 1),
		});
	}

	const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));

	const snapshot = JSON.parse(await readFile(join(import.meta.dirname, 'schema.json'), { encoding: 'utf8' }));
	const diff = await api.request(schemaDiff(snapshot, true));
	await api.request(schemaApply(diff));

	return;
}

export async function teardown(_project: TestProject) {
	if (sb) await sb();
}
