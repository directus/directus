import util from 'node:util';
import { type Database, databases, type Env, type Options, sandboxes, type Sandboxes } from '@directus/sandbox';
import type { DeepPartial } from '@directus/types';
import { type TestProject } from 'vitest/node';

let sb: Sandboxes | undefined;

export async function setup(project: TestProject) {
	// Enable full depth logging for better error visibility
	util.inspect.defaultOptions.depth = null;

	if (process.env['ALL'] !== 'true') return;

	const ports: number[] = [];

	const dbs = databases.map((database, index) => {
		const port = 8000 + index * 100;
		ports.push(port);
		return {
			database,
			options: {
				prefix: database,
				port: port,
				env: {
					CACHE_SCHEMA: 'false',
				},
				docker: {
					port: port + 10,
					keep: true,
				},
				killPorts: true,
			} as DeepPartial<Options>,
		};
	});

	sb = await sandboxes(dbs);

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
