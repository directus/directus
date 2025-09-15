import type { TestProject } from 'vitest/node';
import { databases, Options, sandboxes, Sandboxes } from '@directus/sandbox';
import { createDirectus, staticToken, schemaDiff, schemaApply, rest } from '@directus/sdk';
import { Schema } from './schema';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { DeepPartial } from '@directus/types';

let sb: Sandboxes | undefined;

export async function setup(project: TestProject) {
	if (process.env['ALL'] !== 'true') return;

	const ports: number[] = [];

	const dbs = databases.map((database, index) => {
		const port = 8000 + index * 100;
		ports.push(port);
		return {
			database,
			options: {
				prefix: database,
				port: String(port),
				docker: {
					basePort: String(port + 10),
					keep: true,
				},
				killPorts: true,
			} as DeepPartial<Options>,
		};
	});

	sb = await sandboxes(dbs);

	const snapshot = JSON.parse(await readFile(join(import.meta.dirname, 'schema.json'), { encoding: 'utf8' }));

	await Promise.all(
		ports.map(async (port) => {
			const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
			const diff = await api.request(schemaDiff(snapshot, true));
			if (diff) await api.request(schemaApply(diff));
		}),
	);

	project.provide(
		'envs',
		Object.fromEntries(sb.sandboxes.map((sandbox) => [dbs[sandbox.index].database, sandbox.env])),
	);

	project.provide('options', Object.fromEntries(dbs.map((db) => [db.database, db.options])));
}

export async function teardown(_project: TestProject) {
	if (sb) await sb.stop();
}
