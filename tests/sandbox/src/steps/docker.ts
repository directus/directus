import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { type Env } from '../config.js';
import { type Logger } from '../logger.js';
import type { Database, Options } from '../sandbox.js';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const fileName = fileURLToPath(import.meta.url);
const folderName = dirname(fileName);

export async function dockerUp(database: Database, opts: Options, env: Env, logger: Logger) {
	const start = performance.now();
	logger.info('Starting up Docker containers');

	const extrasList = Object.entries(opts.extras)
		.filter(([_, value]) => value)
		.map(([key, _]) => key);

	const project =
		opts.docker.name ??
		`sandbox_${database}${extrasList.map((extra) => '_' + extra).join('')}` +
			(opts.docker.suffix ? `_${opts.docker.suffix}` : '');

	const files = database === 'sqlite' ? extrasList : [database, ...extrasList];

	if (files.length === 0) return;

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
			},
		},
	);

	docker.on('error', (err) => {
		docker.kill();
		throw err;
	});

	logger.pipe(docker.stdout, 'debug');
	logger.pipe(docker.stderr, 'error');

	await new Promise((resolve) => docker!.on('close', resolve));

	const time = chalk.gray(`(${Math.round(performance.now() - start)}ms)`);

	if ('DB_PORT' in env) {
		logger.info(`Database started at ${env.DB_HOST}:${env.DB_PORT}/${env.DB_DATABASE} ${time}`);
		logger.info(`User: ${chalk.cyan(env.DB_USER)} Password: ${chalk.cyan(env.DB_PASSWORD)}`);
	} else if ('DB_FILENAME' in env) logger.info(`Database stored at ${env.DB_FILENAME} ${time}`);

	return project;
}

export async function dockerDown(project: string, env: Env, logger: Logger) {
	const start = performance.now();
	logger.info('Stopping docker containers');

	const docker = spawn('docker', ['compose', '-p', project, 'down'], {
		env: { ...env, COMPOSE_STATUS_STDOUT: '1' },
	});

	docker.on('error', (err) => {
		docker.kill();
		throw err;
	});

	logger.pipe(docker.stdout, 'debug');
	logger.pipe(docker.stderr, 'error');

	await new Promise((resolve) => docker.on('close', resolve));

	const time = chalk.gray(`(${Math.round(performance.now() - start)}ms)`);

	logger.info(`Docker containers stopped ${time}`);
}
