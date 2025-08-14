import type { TestProject } from 'vitest/node';
import { sandboxes, StopSandbox } from '@directus/sandbox';

let sb: StopSandbox | undefined;

export async function setup(_project: TestProject) {
	if (process.env['ALL'] !== 'true') return;

	const dbs = (['maria', 'cockroachdb', 'mssql', 'mysql', 'oracle', 'postgres', 'sqlite'] as const).map(
		(database, index) => ({
			database,
			options: {
				prefix: database,
				port: String(8000 + index * 100),
				dockerBasePort: String(8000 + index * 100 + 1),
			},
		}),
	);

	sb = await sandboxes(dbs, {
		build: true,
		watch: true,
	});
}

export async function teardown(_project: TestProject) {
	if (sb) await sb();
}
