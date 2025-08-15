import type { TestProject } from 'vitest/node';
import { Database, sandbox, StopSandbox } from '@directus/sandbox';

let sb: StopSandbox | undefined;

export async function setup(project: TestProject) {
	if (process.env['ALL'] === 'true') return;

	const dev = Boolean(project.config.env['DEV']);
	const watch = Boolean(project.config.env['WATCH']);
	const database = project.config.env['DATABASE'] as Database;
	const port = project.config.env['PORT'];

	sb = await sandbox(database, {
		port,
		dev: true,
		watch: true,
		prefix: database,
		dockerBasePort: String(Number(project.config.env['PORT']) + 1),
	});
}

export async function teardown(_project: TestProject) {
	if (sb) await sb();
}
