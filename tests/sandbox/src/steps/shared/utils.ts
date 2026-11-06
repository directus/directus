import { spawn } from 'child_process';
import { createHash } from 'crypto';
import { mkdir, readdir, readFile, rm, stat } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { type Env } from '../../config.js';
import { apiFolder, type Options } from '../../sandbox.js';

/** Env variables that bootstrap writes into the database */
const bootstrapEnv = ['ADMIN_EMAIL', 'ADMIN_PASSWORD', 'ADMIN_TOKEN', 'PROJECT_NAME', 'PROJECT_OWNER'];

/**
 * Templates are keyed by everything that influences the outcome of bootstrapping,
 * so a template is rebuilt whenever migrations, seeds or the initial admin change.
 */
export async function getTemplateKey(opts: Options, env: Env) {
	const hash = createHash('sha256');
	// Bootstrap runs from source in dev mode and from the build otherwise
	const folder = join(apiFolder, opts.dev ? 'src' : 'dist', 'database');

	for (const dir of ['migrations', 'seeds']) {
		const entries = await readdir(join(folder, dir), { recursive: true, withFileTypes: true });

		const files = entries
			.filter((entry) => entry.isFile())
			.map((entry) => join(entry.parentPath, entry.name))
			.sort();

		for (const file of files) {
			hash.update(file.slice(folder.length));
			hash.update(await readFile(file));
		}
	}

	for (const key of bootstrapEnv) {
		hash.update(`${key}=${(env as Record<string, string | undefined>)[key] ?? ''}`);
	}

	return hash.digest('hex').slice(0, 12);
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
 * `mkdir` is atomic, locks older than `staleAfter` are assumed to be left over from a crashed process.
 */
export async function withLock<T>(name: string, fn: () => Promise<T>, staleAfter = 5 * 60_000): Promise<T> {
	const lock = join(tmpdir(), `${name}.lock`);

	while (true) {
		try {
			await mkdir(lock);
			break;
		} catch (err: any) {
			if (err.code !== 'EEXIST') throw err;

			const age = await stat(lock).then(
				(s) => Date.now() - s.mtimeMs,
				() => 0,
			);

			if (age > staleAfter) await rm(lock, { recursive: true, force: true });
			else await new Promise((resolve) => setTimeout(resolve, 250));
		}
	}

	try {
		return await fn();
	} finally {
		await rm(lock, { recursive: true, force: true });
	}
}
