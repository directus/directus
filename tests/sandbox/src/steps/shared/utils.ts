import { spawn } from 'child_process';
import { createHash, randomBytes } from 'crypto';
import { readdir, readFile, rename, rm, stat, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { type Env } from '../../config.js';
import { apiFolder, type Options } from '../../sandbox.js';

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
 * Key of everything affecting bootstrap, so templates rebuild when migrations, seeds or the admin change.
 */
export async function getTemplateKey(opts: Options, env: Env) {
	const hash = createHash('sha256');
	const folder = join(apiFolder, opts.dev ? 'src' : 'dist', 'database');

	const values = env as Record<string, string | undefined>;

	await hashFolder(hash, join(folder, 'migrations'));
	await hashFolder(hash, join(folder, 'seeds'));
	// Custom migrations resolve against the inherited cwd
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
 * Cross process lock around starting shared containers and building templates.
 * Holds the pid of its owner and is only taken over once that process is gone.
 */
export async function withLock<T>(name: string, fn: () => Promise<T>): Promise<T> {
	const lock = join(tmpdir(), `${name}.lock`);

	while (true) {
		try {
			await writeFile(lock, String(process.pid), { flag: 'wx' });
			break;
		} catch (err: any) {
			if (err.code !== 'EEXIST') throw err;
		}

		if (await isStale(lock)) {
			// Rename is atomic, so only one waiter removes a stale lock
			const stale = `${lock}.${randomBytes(8).toString('hex')}`;

			await rename(lock, stale).then(
				() => rm(stale, { recursive: true, force: true }),
				() => {},
			);
		} else {
			await new Promise((resolve) => setTimeout(resolve, 250));
		}
	}

	try {
		return await fn();
	} finally {
		await rm(lock, { force: true });
	}
}

async function isStale(lock: string) {
	const [pid, age] = await Promise.all([
		readFile(lock, 'utf8').catch(() => ''),
		stat(lock).then(
			(s) => Date.now() - s.mtimeMs,
			() => 0,
		),
	]);

	// A crash between create and pid write would otherwise leave the lock forever
	if (!pid) return age > 10_000;

	try {
		process.kill(Number(pid), 0);
		return false;
	} catch (err: any) {
		// EPERM: process exists but belongs to another user
		return err.code === 'ESRCH';
	}
}
