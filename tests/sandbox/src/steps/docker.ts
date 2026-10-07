import { spawn, spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { type Env } from '../config.js';
import { type Logger } from '../logger.js';
import type { Database, Options } from '../sandbox.js';

const fileName = fileURLToPath(import.meta.url);
const folderName = dirname(fileName);

/**
 * @param snapshotImage Start the database from this image, using the `<database>-snapshot.yml` override.
 * Used both to start a committed snapshot and to create one from the base image.
 */
export async function dockerUp(database: Database, opts: Options, env: Env, logger: Logger, snapshotImage?: string) {
	const extras = opts.extras;

	const extrasList = Object.entries(extras)
		.filter(([_, value]) => value)
		.map(([key, _]) => key);

	const databaseFiles = snapshotImage ? [database, `${database}-snapshot`] : [database];
	const files = database === 'sqlite' ? extrasList : [...databaseFiles, ...extrasList];

	let project: string | undefined = undefined;

	if (files.length > 0) {
		project =
			opts.docker.name ??
			`sandbox_${database}${extrasList.map((extra) => '_' + extra).join('')}` +
				(opts.docker.suffix ? `_${opts.docker.suffix}` : '');
	}

	const start = performance.now();

	if (project) {
		logger.info('Starting up Docker containers');

		const result = spawnSync('docker', ['ps']);

		if (result.status !== 0) {
			logger.error('Docker is not running or installation is missing');
			throw new Error('Docker is not running or installation is missing');
		}

		if (!opts.docker.keep) {
			logger.info('Removing old containers');
			await dockerDown(project, env, logger);
		}

		const docker = spawn(
			'docker',
			[
				'compose',
				'-p',
				project,
				...files.flatMap((file) => ['-f', join(folderName, '..', 'docker', `${file}.yml`)]),
				'up',
				'-d',
				'--wait',
			],
			{
				env: {
					...env,
					COMPOSE_STATUS_STDOUT: '1', //Ref: https://github.com/docker/compose/issues/7346
					...(snapshotImage ? { SNAPSHOT_IMAGE: snapshotImage } : {}),
				},
			},
		);

		docker.on('error', (err) => {
			docker.kill();
			throw err;
		});

		let output = '';
		docker.stdout.on('data', (data: unknown) => (output += String(data)));
		docker.stderr.on('data', (data: unknown) => (output += String(data)));

		logger.pipe(docker.stdout, 'debug');
		logger.pipe(docker.stderr, 'debug');

		const code = await new Promise<number | null>((resolve) => docker.on('close', resolve));

		if (code !== 0) {
			const details = output.trim();
			logger.error(`Docker compose failed with exit code ${code}`);
			throw new Error(`Docker compose failed with exit code ${code}${details ? `:\n${details}` : ''}`);
		}
	}

	const time = chalk.gray(`(${Math.round(performance.now() - start)}ms)`);

	if ('DB_PORT' in env) {
		logger.info(`Database started at ${env.DB_HOST}:${env.DB_PORT}/${env.DB_DATABASE} ${time}`);
		logger.info(`User: ${chalk.cyan(env.DB_USER)} Password: ${chalk.cyan(env.DB_PASSWORD)}`);
	} else if ('DB_FILENAME' in env) {
		if (!opts.docker.keep && existsSync(join(process.cwd(), env.DB_FILENAME))) {
			await unlink(join(process.cwd(), env.DB_FILENAME));
			logger.info(`Removed old database file at ${env.DB_FILENAME}`);
		}

		logger.info(`Database stored at ${env.DB_FILENAME} ${time}`);
	}

	// Nothing to tear down when no compose file applied (sqlite without extras)
	return project;
}

export async function dockerDown(project: string, env: Env, logger: Logger) {
	const start = performance.now();
	logger.info('Stopping docker containers');

	// No grace period: the containers hold throwaway test data and most ignore SIGTERM, which would cost 10s each time
	const docker = spawn('docker', ['compose', '-p', project, 'down', '-t', '0'], {
		env: { ...env, COMPOSE_STATUS_STDOUT: '1' },
	});

	docker.on('error', (err) => {
		docker.kill();
		throw err;
	});

	logger.pipe(docker.stdout, 'debug');
	logger.pipe(docker.stderr, 'debug');

	await new Promise((resolve) => docker.on('close', resolve));

	const time = chalk.gray(`(${Math.round(performance.now() - start)}ms)`);

	logger.info(`Docker containers stopped ${time}`);
}
