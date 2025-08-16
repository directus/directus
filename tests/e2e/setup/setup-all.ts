import type { TestProject } from 'vitest/node';
import { sandboxes, StopSandbox } from '@directus/sandbox';
import { createDirectus, staticToken, schemaDiff, schemaApply, rest } from '@directus/sdk';
import { Schema } from './schema';
import { readFile } from 'fs/promises';
import { join } from 'path';

let sb: StopSandbox | undefined;

export async function setup(_project: TestProject) {
	if (process.env['ALL'] !== 'true') return;

	const ports: number[] = [];

	const dbs = (['maria', 'cockroachdb', 'mssql', 'mysql', 'oracle', 'postgres', 'sqlite'] as const).map(
		(database, index) => {
			const port = 8000 + index * 100;
			ports.push(port);
			return {
				database,
				options: {
					prefix: database,
					port: String(port),
					dockerBasePort: String(port + 1),
				},
			};
		},
	);

	sb = await sandboxes(dbs, {
		build: true,
		watch: true,
	});

	const snapshot = JSON.parse(await readFile(join(import.meta.dirname, 'schema.json'), { encoding: 'utf8' }));

	await Promise.all(
		ports.map(async (port) => {
			const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
			const diff = await api.request(schemaDiff(snapshot, true));
			await api.request(schemaApply(diff));
		}),
	);
}

export async function teardown(_project: TestProject) {
	if (sb) await sb();
}
