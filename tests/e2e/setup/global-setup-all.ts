import { readFile } from 'fs/promises';
import { join } from 'path';
import { argv } from 'process';
import { type Database, databases, type Env, type Options, sandboxes, type Sandboxes } from '@directus/sandbox';
import { createDirectus, rest, schemaApply, schemaDiff, staticToken } from '@directus/sdk';
import type { DeepPartial } from '@directus/types';
import { parseCLI, type TestProject } from 'vitest/node';
import type { Schema } from './schema.d.ts';

let sb: Sandboxes | undefined;

export async function setup(project: TestProject) {
	if (process.env['ALL'] !== 'true') return;

	const args = parseCLI(['vitest', ...argv.slice(2)]);

	const filesToTest = await project.globTestFiles(args.filter);

	if (filesToTest.testFiles.every((file) => file.endsWith('.sb.test.ts'))) return;

	const ports: number[] = [];

	const dbs = databases.map((database, index) => {
		const port = 8000 + index * 100;
		ports.push(port);
		return {
			database,
			options: {
				prefix: database,
				port: port,
				docker: {
					port: port + 10,
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
		Object.fromEntries(sb.sandboxes.map((sandbox, index) => [dbs[index]!.database, sandbox.env])) as Record<
			Database,
			Env
		>,
	);

	project.provide(
		'options',
		Object.fromEntries(dbs.map((db) => [db.database, db.options])) as Record<Database, DeepPartial<Options>>,
	);
}

export async function teardown(_project: TestProject) {
	if (sb) await sb.stop();
}
