import type { TestProject } from 'vitest/node';
import { Database, sandbox, StopSandbox } from '@directus/sandbox';

let sb: StopSandbox | undefined;

export async function setup(project: TestProject) {
	const dev = Boolean(project.config.env['DEV']);
	const watch = Boolean(project.config.env['WATCH']);

	sb = await sandbox(project.config.env['DATABASE'] as Database, {
		port: project.config.env['PORT'],
		dev,
		watch,
		dockerBasePort: String(Number(project.config.env['PORT']) + 1),
	});
}

export async function teardown(_project: TestProject) {
	if (sb) await sb();
}
