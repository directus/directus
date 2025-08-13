import type { DatabaseClient, DeepPartial } from '@directus/types';
import { createLogger, type Logger } from './logger.js';
import { join } from 'path';
import { merge } from 'lodash-es';
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import { getEnv, type Env } from './config.js';
import knex from 'knex';

export type StopSandbox = () => Promise<void>;
export type Database = Exclude<DatabaseClient, 'redshift'> | 'maria';

export type Options = {
	build: boolean;
	dev: boolean;
	watch: boolean;
	port: string;
	dockerBasePort: string;
	scale: string;
	env: Record<string, string>;
	prefix: string | undefined;
	extras: {
		redis: boolean;
		saml: boolean;
		minio: boolean;
		maildev: boolean;
	};
};

const apiFolder = join(import.meta.dirname, '..', '..', '..', 'api');

export async function sandboxes(
	sandboxes: { database: Database; options: DeepPartial<Omit<Options, 'build' | 'dev' | 'watch'>> }[],
	options?: Partial<Pick<Options, 'build' | 'dev' | 'watch'>>,
): Promise<StopSandbox> {
	const opts = getOptions(options);
	const logger = createLogger();
	let apis: { processes: ChildProcessWithoutNullStreams[]; opts: Options; env: Env; logger: Logger }[] = [];
	const projects: { project: string; logger: Logger }[] = [];

	// Rebuild directus
	if (opts.build && !opts.dev) {
		await buildDirectus(opts, logger, async () => {
			apis.forEach((api) => api.processes.forEach((process) => process.kill()));

			apis = await Promise.all(
				apis.map(async (api) => ({ ...api, processes: await startDirectus(api.opts, api.env, api.logger) })),
			);
		});
	}

	await Promise.all(
		sandboxes.map(async ({ database, options }) => {
			const opts = getOptions(options);

			const logger = opts.prefix ? createLogger(opts.prefix) : createLogger();

			const env = getEnv(database, opts);

			const project = await dockerUp(database, opts.extras, env, logger);
			if (project) projects.push({ project, logger });

			await bootstrap(env, logger);

			try {
				apis.push({ processes: await startDirectus(opts, env, logger), opts, env, logger });
			} catch (e) {
				stop();
				throw e;
			}
		}),
	);

	async function stop() {
		apis.forEach((api) => api.processes.forEach((process) => process.kill()));
		await Promise.all(projects.map(({ project, logger }) => dockerDown(project, logger)));
		process.exit();
	}

	return stop;
}

export async function sandbox(database: Database, options?: DeepPartial<Options>): Promise<StopSandbox> {
	const opts = getOptions(options);

	const logger = opts.prefix ? createLogger(opts.prefix) : createLogger();
	let apis: ChildProcessWithoutNullStreams[] = [];
	const env = getEnv(database, opts);

	// Rebuild directus
	if (opts.build && !opts.dev) {
		await buildDirectus(opts, logger, async () => {
			apis.forEach((api) => api.kill());
			apis = await startDirectus(opts, env, logger);
		});
	}

	const project = await dockerUp(database, opts.extras, env, logger);

	await bootstrap(env, logger);

	try {
		apis = await startDirectus(opts, env, logger);
	} catch (e) {
		stop();
		throw e;
	}

	async function stop() {
		apis.forEach((api) => api.kill());
		if (project) await dockerDown(project, logger);
		process.exit();
	}

	return stop;
}

function getOptions(options?: DeepPartial<Options>): Options {
	return merge(
		{
			build: false,
			dev: false,
			watch: false,
			port: '8055',
			dockerBasePort: '6000',
			scale: '1',
			env: {} as Record<string, string>,
			prefix: undefined,
			extras: {
				redis: false,
				maildev: false,
				minio: false,
				saml: false,
			},
		} satisfies Options,
		options,
	);
}

async function buildDirectus(opts: Options, logger: Logger, onRebuild: () => void) {
	logger.info('Rebuilding Directus');

	const build = spawn(
		/^win/.test(process.platform) ? 'pnpm.cmd' : 'pnpm',
		opts.watch ? ['tsc', '--watch', '--project tsconfig.prod.json'] : ['run', 'build'],
		{
			cwd: apiFolder,
			shell: true,
		},
	);

	logger.pipe(build.stderr, 'error');

	if (opts.watch) {
		await new Promise((resolve, reject) => {
			build!.stdout!.on('data', (data) => {
				logger.debug(String(data));

				if (String(data).includes(`Watching for file changes.`)) {
					onRebuild();
					resolve(undefined);
				}
			});

			// In case the api takes too long to start
			setTimeout(() => reject(new Error('timeout building directus')), 60_000);
		});
	} else {
		logger.pipe(build.stdout);
		await new Promise((resolve) => build.on('close', resolve));
		logger.info('New Build Complete');
	}
}

async function dockerUp(database: Database, extras: Options['extras'], env: Env, logger: Logger) {
	logger.info('Starting up Docker containers');

	const extrasList = Object.entries(extras)
		.filter(([_, value]) => value)
		.map(([key, _]) => key);

	const project = `loadtests_${database}${extrasList.map((extra) => '_' + extra).join('')}`;
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

	logger.pipe(docker.stdout, 'debug');
	logger.pipe(docker.stderr, 'error');

	await new Promise((resolve) => docker!.on('close', resolve));

	while (!(await testDBCollection(database, env))) {
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}

	if ('DB_PORT' in env) logger.info(`Database started at ${env.DB_HOST}:${env.DB_PORT}`);
	else if ('DB_FILENAME' in env) logger.info(`Database stored at ${env.DB_FILENAME}`);

	return project;
}

async function dockerDown(project: string, logger: Logger) {
	logger.info('Stopping docker containers');

	const docker = spawn('docker', ['compose', '-p', project, 'down'], {
		env: { PATH: process.env['PATH'], COMPOSE_STATUS_STDOUT: '1' },
	});

	logger.pipe(docker.stdout, 'debug');
	logger.pipe(docker.stderr, 'error');

	await new Promise((resolve) => docker.on('close', resolve));

	logger.info('Docker containers stopped');
}

async function bootstrap(env: Env, logger: Logger) {
	logger.info('Bootstraping Database');

	const bootstrap = spawn('node', [join(apiFolder, 'dist', 'cli', 'run.js'), 'bootstrap'], {
		env,
	});

	logger.pipe(bootstrap.stdout, 'debug');
	logger.pipe(bootstrap.stderr, 'error');

	await new Promise((resolve) => bootstrap.on('close', resolve));
	logger.info('Completed Bootstraping Database');
}

async function startDirectus(opts: Options, env: Env, logger: Logger) {
	const apiCount = Math.max(1, Number(opts.scale));

	return await Promise.all(
		[...Array(apiCount).keys()].map((i) => {
			const newLogger = apiCount > 1 ? logger.addGroup(`API ${i}`) : logger;
			return startDirectusInstance(opts, { ...env, PORT: String(Number(env.PORT) + i) }, newLogger);
		}),
	);
}

async function startDirectusInstance(opts: Options, env: Env, logger: Logger) {
	logger.info('Starting Directus');
	let api;

	if (opts.dev) {
		api = spawn(
			'tsx',
			opts.watch
				? ['watch', '--clear-screen=false', '--inspect', join(apiFolder, 'src', 'start.ts')]
				: ['--inspect', join(apiFolder, 'src', 'start.ts')],
			{
				env,
			},
		);
	} else {
		api = spawn('node', [join(apiFolder, 'dist', 'cli', 'run.js'), 'start'], {
			env,
		});
	}

	logger.pipe(api.stderr, 'error');

	await new Promise((resolve, reject) => {
		api!.stdout!.on('data', (data) => {
			if (String(data).includes(`Server started at http://${env.HOST}:${env.PORT}`)) {
				resolve(undefined);
			} else {
				logger.debug(String(data));
			}
		});

		// In case the api takes too long to start
		setTimeout(() => {
			reject(new Error('timeout starting directus'));
		}, 60_000);
	});

	logger.info(`Server started at http://${env.HOST}:${env.PORT}`);

	return api;
}

export async function testDBCollection(database: Database, env: Env): Promise<boolean> {
	const db =
		'DB_FILENAME' in env
			? knex({
					client: 'sqlite3',
					connection: {
						filename: env.DB_FILENAME,
					},
				})
			: knex({
					client: {
						mysql: 'mysql2',
						postgres: 'pg',
						maria: 'mysql2',
						cockroachdb: 'cockroachdb',
						mssql: 'mssql',
						oracle: 'oracledb',
					}[database as Exclude<Database, 'sqlite'>],
					connection: {
						host: env.DB_HOST,
						port: Number(env.DB_PORT),
						user: env.DB_USER,
						password: env.DB_PASSWORD,
						database: env.DB_DATABASE,
					},
				});

	try {
		if (database === 'oracle') {
			await db.raw('select 1 from DUAL');
		} else {
			await db.raw('SELECT 1');
		}

		return true;
	} catch {
		return false;
	}
}
