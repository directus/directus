import type { TestProject } from 'vitest/node';
import { Database, sandbox, StopSandbox } from '@directus/sandbox';

let sb: StopSandbox | undefined;

export async function setup(_project: TestProject) {
	sb = await sandbox((process.env['DATABASE'] as Database) ?? 'postgres', { extras: { maildev: true } });
}

export async function teardown(_project: TestProject) {
	if (sb) await sb();
}
