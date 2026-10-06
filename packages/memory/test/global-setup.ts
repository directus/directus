import { execFile } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import type { TestProject } from 'vitest/node';

const exec = promisify(execFile);

const COMPOSE_FILE = join(dirname(fileURLToPath(import.meta.url)), 'docker-compose.yml');

/** Suffixed with the image so that switching `REDIS_IMAGE` doesn't reuse the previous container */
const PROJECT = `directus-memory-test-${(process.env['REDIS_IMAGE'] ?? 'redis:6-alpine').replace(/[^a-z0-9]/gi, '-')}`;

const compose = (...args: string[]) => exec('docker', ['compose', '-p', PROJECT, '-f', COMPOSE_FILE, ...args]);

/** Set to reuse an already running Redis (e.g. a CI service container) instead of spinning one up */
const externalPort = process.env['REDIS_TEST_PORT'];

export async function setup(project: TestProject) {
	if (externalPort) {
		project.provide('redisPort', Number(externalPort));
		return;
	}

	try {
		await exec('docker', ['ps']);
	} catch {
		throw new Error(
			'These tests need Docker to spin up Redis. Start Docker, or point REDIS_TEST_PORT at a running instance.',
		);
	}

	await compose('up', '-d', '--wait');

	// Resolves to `0.0.0.0:<port>`, with a line per address family
	const { stdout } = await compose('port', 'redis', '6379');
	const mapping = stdout.trim().split('\n')[0];
	const port = Number(mapping?.split(':').pop());

	if (!port) {
		throw new Error(`Could not determine the mapped Redis port from "${stdout.trim()}"`);
	}

	project.provide('redisPort', port);
}

export async function teardown() {
	if (externalPort) return;

	await compose('down', '-v');
}
