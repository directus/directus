import { spawn } from 'child_process';
import { createHash, randomUUID } from 'crypto';
import chalk from 'chalk';
import { type Env } from '../config.js';
import { type Logger } from '../logger.js';
import type { Database } from '../sandbox.js';

/**
 * Base images of the databases whose bootstrapped state can be committed into a docker image.
 * Each needs a `<database>-snapshot.yml` override that stores its data in the container filesystem.
 */
const baseImages: Partial<Record<Database, (env: Env) => string>> = {
	cockroachdb: (env) => `cockroachdb/cockroach:${'DB_VERSION' in env ? env.DB_VERSION : ''}`,
};

export function snapshotBaseImage(database: Database, env: Env) {
	return baseImages[database]?.(env);
}

/** Env vars that influence what `directus bootstrap` writes to the database */
const bootstrapKeys = [
	'DB_VERSION',
	'DB_DATABASE',
	'DB_USER',
	'ADMIN_EMAIL',
	'ADMIN_PASSWORD',
	'ADMIN_TOKEN',
	'PROJECT_OWNER',
	'PROJECT_NAME',
	'ACCEPT_TERMS',
	'MIGRATIONS_PATH',
];

export function snapshotEnvKey(database: Database) {
	return `SANDBOX_SNAPSHOT_${database.toUpperCase()}`;
}

function fingerprint(env: Env) {
	const values = bootstrapKeys.map((key) => [key, (env as Record<string, unknown>)[key] ?? null]);
	return createHash('sha256').update(JSON.stringify(values)).digest('hex').slice(0, 12);
}

export function snapshotImageName(database: Database, env: Env) {
	return `directus-sandbox-snapshot:${database}-${randomUUID().slice(0, 8)}-${fingerprint(env)}`;
}

/**
 * Returns the snapshot image announced via `SANDBOX_SNAPSHOT_<DATABASE>`,
 * but only if it was bootstrapped with the same inputs as this sandbox
 */
export function findSnapshot(database: Database, env: Env): string | undefined {
	if (!(database in baseImages)) return undefined;

	const image = process.env[snapshotEnvKey(database)];

	if (!image?.endsWith(`-${fingerprint(env)}`)) return undefined;

	return image;
}

export async function commitSnapshot(project: string, database: Database, image: string, env: Env, logger: Logger) {
	const start = performance.now();
	logger.info(`Committing snapshot ${image}`);

	const container = (await run('docker', ['compose', '-p', project, 'ps', '-aq', database], env, logger)).trim();

	if (!container) throw new Error(`No ${database} container found in project ${project}`);

	// Stop first so the store is in a consistent state on disk before it is committed
	await run('docker', ['stop', '-t', '15', container], env, logger);
	await run('docker', ['commit', container, image], env, logger);

	const time = chalk.gray(`(${Math.round(performance.now() - start)}ms)`);
	logger.info(`Committed snapshot ${image} ${time}`);
}

export async function removeSnapshot(image: string, env: Env, logger: Logger) {
	logger.info(`Removing snapshot ${image}`);

	try {
		await run('docker', ['image', 'rm', image], env, logger);
	} catch (err) {
		// Containers from kept sandboxes may still reference the image
		logger.warn(String(err));
	}
}

async function run(command: string, args: string[], env: Env, logger: Logger) {
	const child = spawn(command, args, { env });

	let stdout = '';
	let stderr = '';
	child.stdout.on('data', (data: unknown) => (stdout += String(data)));
	child.stderr.on('data', (data: unknown) => (stderr += String(data)));

	const code = await new Promise<number | null>((resolve, reject) => {
		child.on('error', reject);
		child.on('close', resolve);
	});

	if (stdout.trim()) logger.debug(stdout.trim());

	if (code !== 0) throw new Error(`${command} ${args.join(' ')} failed with exit code ${code}: ${stderr.trim()}`);

	return stdout;
}
