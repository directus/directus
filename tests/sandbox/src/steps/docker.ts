import { spawn } from 'child_process';
import { join } from 'path';
import { type Env } from '../config.js';
import { type Logger } from '../logger.js';
import type { Database, Options } from '../sandbox.js';

export async function dockerUp(database: Database, extras: Options['extras'], env: Env, logger: Logger) {
	logger.info('Starting up Docker containers');

	const extrasList = Object.entries(extras)
		.filter(([_, value]) => value)
		.map(([key, _]) => key);

	const project = `sandbox_${database}${extrasList.map((extra) => '_' + extra).join('')}`;
	const files = database === 'sqlite' ? extrasList : [database, ...extrasList];

	if (files.length === 0) return;

	const docker = spawn(
		'docker',
		[
			'compose',
			'-p',
			project,
			...files.flatMap((file) => ['-f', join(import.meta.dirname, '..', 'docker', `${file}.yml`)]),
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

	if ('DB_PORT' in env) {
		logger.info(`Database started at ${env.DB_HOST}:${env.DB_PORT}/${env.DB_DATABASE}`);
		logger.info(`User: ${env.DB_USER} Password: ${env.DB_PASSWORD}`);
	} else if ('DB_FILENAME' in env) logger.info(`Database stored at ${env.DB_FILENAME}`);

	return project;
}

export async function dockerDown(project: string, env: Env, logger: Logger) {
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

	logger.info('Docker containers stopped');
}
