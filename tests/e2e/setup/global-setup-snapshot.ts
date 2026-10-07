import { type Database, type Snapshot, snapshot } from '@directus/sandbox';
import type { TestProject } from 'vitest/node';

let snap: Snapshot | undefined;

/**
 * Bootstraps the database once and commits it into a docker image, so every sandbox in this
 * project can start from the bootstrapped state instead of running all migrations again.
 */
export async function setup(project: TestProject) {
	// Dev mode keeps containers around between runs, which can't depend on a snapshot that is removed on teardown
	if (project.config.env['NODE_ENV'] === 'development') return;

	const database = project.config.env['DATABASE'] as Database;

	snap = await snapshot(database, {
		prefix: `${database}-snapshot`,
		env: { CACHE_SCHEMA: 'false' },
	});

	project.provide('snapshotEnv', snap?.env ?? {});
}

export async function teardown(_project: TestProject) {
	if (snap) await snap.remove();
}
