import type { TestProject } from 'vitest/node';
import { sandbox, StopSandbox } from '@directus/sandbox';

let sb: StopSandbox | undefined;

export async function setup(_project: TestProject) {
	sb = await sandbox('maria', { extras: { maildev: true } });
}

export async function teardown(_project: TestProject) {
	if (sb) await sb();
}
