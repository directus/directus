import { spawn } from 'child_process';
import { createHash, randomBytes } from 'crypto';
import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { type Env } from '../../config.js';
import { apiFolder, type Options } from '../../sandbox.js';

/** Env variables that influence what bootstrap writes into the database */
const bootstrapEnv = [
	'ADMIN_EMAIL',
	'ADMIN_PASSWORD',
	'ADMIN_TOKEN',
	'PROJECT_NAME',
	'PROJECT_OWNER',
	'ACCEPT_TERMS',
	'MIGRATIONS_PATH',
	'TZ',
	'DB_CHARSET',
	'DB_COLLATION',
	'DB_SEARCH_PATH',
	'DB_EXCLUDE_TABLES',
];

/**
 * Templates are keyed by everything that influences the outcome of bootstrapping,
 * so a template is rebuilt whenever migrations, seeds or the initial admin change.
 */
export async function getTemplateKey(opts: Options, env: Env) {
	const hash = createHash('sha256');
	// Bootstrap runs from source in dev mode and from the build otherwise
	const folder = join(apiFolder, opts.dev ? 'src' : 'dist', 'database');

	const values = env as Record<string, string | undefined>;

	await hashFolder(hash, join(folder, 'migrations'));
	await hashFolder(hash, join(folder, 'seeds'));
	// Custom migrations are resolved against the cwd the bootstrap process inherits
	await hashFolder(hash, resolve(values['MIGRATIONS_PATH'] ?? './migrations'), true);

	for (const key of bootstrapEnv) {
		hash.update(`${key}=${values[key] ?? ''}\n`);
	}

	return hash.digest('hex').slice(0, 12);
}

async function hashFolder(hash: ReturnType<typeof createHash>, folder: string, optional = false) {
	const entries = await readdir(folder, { recursive: true, withFileTypes: true }).catch((err) => {
		if (optional && err.code === 'ENOENT') return [];
		throw err;
	});

	const files = entries
		.filter((entry) => entry.isFile())
		.map((entry) => join(entry.parentPath, entry.name))
		.sort();

	hash.update(`${folder}\n`);

	for (const file of files) {
		hash.update(`${file.slice(folder.length)}\n`);
		hash.update(await readFile(file));
	}
}

export async function findContainer(project: string, service: string) {
	const { output } = await exec('docker', [
		'ps',
		'-q',
		'--filter',
		`label=com.docker.compose.project=${project}`,
		'--filter',
		`label=com.docker.compose.service=${service}`,
	]);

	return output.trim().split('\n')[0] || undefined;
}

export async function isHealthy(container: string) {
	const { output } = await exec('docker', ['inspect', '-f', '{{.State.Health.Status}}', container]);
	return output.trim() === 'healthy';
}

export async function getHostPort(container: string, port: number) {
	// Output looks like `0.0.0.0:8123\n[::]:8123`
	const { output } = await exec('docker', ['port', container, `${port}/tcp`]);
	const hostPort = output.trim().split('\n')[0]?.split(':').at(-1);
	if (!hostPort) throw new Error(`Port ${port} of container ${container} is not published`);
	return hostPort;
}

export async function exec(command: string, args: string[], input?: string) {
	const child = spawn(command, args);

	let output = '';
	child.stdout.on('data', (data: unknown) => (output += String(data)));
	child.stderr.on('data', (data: unknown) => (output += String(data)));

	if (input !== undefined) child.stdin.end(input);

	const code = await new Promise<number | null>((resolve, reject) => {
		child.on('error', reject);
		child.on('close', resolve);
	});

	if (code !== 0) throw new Error(`${command} ${args.join(' ')} failed with exit code ${code}:\n${output.trim()}`);

	return { output };
}

/**
 * Cross process lock, so parallel sandboxes don't try to start the same shared container or build the same template at once.
 * `mkdir` is atomic. The lock stores the pid of its holder, so it is only taken over once that process is gone,
 * no matter how long the holder takes. All sandboxes share the host, so the pid check is reliable.
 */
export async function withLock<T>(name: string, fn: () => Promise<T>): Promise<T> {
	const lock = join(tmpdir(), `${name}.lock`);
	const ownerFile = join(lock, 'owner');
	const owner = `${process.pid}:${randomBytes(8).toString('hex')}`;
	const readOwner = (dir = lock) => readFile(join(dir, 'owner'), 'utf8').catch(() => undefined);

	while (true) {
		try {
			await mkdir(lock);
			await writeFile(ownerFile, owner);
			break;
		} catch (err: any) {
			if (err.code !== 'EEXIST') throw err;

			const current = await readOwner();

			if (await isStale(lock, current)) {
				// Renaming is atomic, so only a single waiter can take over a stale lock
				const stale = `${lock}.${randomBytes(8).toString('hex')}.stale`;

				const renamed = await rename(lock, stale).then(
					() => true,
					() => false,
				);

				if (renamed) {
					// The lock might have changed hands between the check and the rename, so hand it back
					if ((await readOwner(stale)) !== current) await rename(stale, lock).catch(() => {});
					await rm(stale, { recursive: true, force: true });
				}
			} else {
				await new Promise((resolve) => setTimeout(resolve, 250));
			}
		}
	}

	try {
		return await fn();
	} finally {
		if ((await readOwner()) === owner) await rm(lock, { recursive: true, force: true });
	}
}

async function isStale(lock: string, owner: string | undefined) {
	// The owner is written right after the lock is created, so only treat a missing owner as stale after a grace period
	if (!owner) {
		const age = await stat(lock).then(
			(s) => Date.now() - s.mtimeMs,
			() => 0,
		);

		return age > 10_000;
	}

	try {
		process.kill(Number(owner.split(':')[0]), 0);
		return false;
	} catch (err: any) {
		// EPERM means the process exists but belongs to another user
		return err.code === 'ESRCH';
	}
}
