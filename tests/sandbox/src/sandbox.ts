import type { DatabaseClient, DeepPartial } from '@directus/types';
import { createLogger, type Logger } from './logger.js';
import { join } from 'path';
import { baseConfig } from './config.js';
import { merge } from 'lodash-es';
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';

export type StopSandbox = () => Promise<void>;
export type Database = Exclude<DatabaseClient, 'redshift'> | 'maria';

export type Options = {
	build: boolean;
	dev: boolean;
	watch: boolean;
	port: string;
	extras: {
		redis: boolean;
		saml: boolean;
		minio: boolean;
		maildev: boolean;
		authentik: boolean;
	};
};

type Env = (typeof baseConfig)[Database] & { PORT: string; REDIS_ENABLED: string };
const apiFolder = join(import.meta.dirname, '..', '..', '..', 'api');

export async function sandbox(database: Database, options?: DeepPartial<Options>): Promise<StopSandbox> {
	const logger = createLogger();

	const opts: Options = merge(
		{
			build: false,
			dev: false,
			watch: false,
			port: '8055',
			extras: {
				redis: false,
				authentik: false,
				maildev: false,
				minio: false,
				saml: false,
			},
		} satisfies Options,
		options,
	);

	const env: Env = { ...baseConfig[database], PORT: opts.port, REDIS_ENABLED: String(opts.extras.redis) };

	let api: ChildProcessWithoutNullStreams | undefined = undefined;

	// Rebuild directus
	if (opts.build && !opts.dev) {
		buildDirectus(opts, logger, async () => {
			if (api) {
				api.kill();
				api = await startDirectus(opts, env, logger);
			}
		});
	}

	const project = await dockerUp(database, opts.extras, env, logger);

	await bootstrap(env, logger);

	api = await startDirectus(opts, env, logger);

	async function stop() {
		await dockerDown(project, logger);

		if (api) {
			api.kill();
		}
	}

	return stop;
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
			setTimeout(reject, 10_000);
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
				PATH: process.env['PATH'],
			},
		},
	);

	logger.pipe(docker.stdout);
	logger.pipe(docker.stderr, 'error');

	await new Promise((resolve) => docker!.on('close', resolve));
	await new Promise((resolve) => setTimeout(resolve, 10_000));

	logger.info('Docker containers started');

	return project;
}

async function dockerDown(project: string, logger: Logger) {
	const docker = spawn('docker', ['compose', '-p', project, 'down']);

	logger.pipe(docker.stdout, 'debug');
	logger.pipe(docker.stderr, 'error');

	await new Promise((resolve) => docker.on('close', resolve));
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
	let api;

	if (opts.dev) {
		api = spawn('pnpm', opts.watch ? ['tsx', 'watch', 'src/start.ts'] : ['tsx', 'src/start.ts'], {
			cwd: apiFolder,
			env,
		});
	} else {
		api = spawn('node', [join(apiFolder, 'dist', 'cli', 'run.js'), 'start'], {
			env,
		});
	}

	logger.pipe(api.stderr, 'error');

	await new Promise((resolve, reject) => {
		api!.stdout!.on('data', (data) => {
			logger.debug(String(data));

			if (String(data).includes(`Server started at http://${env.HOST}:${env.PORT}`)) {
				resolve(undefined);
				logger.info(String(data));
			}
		});

		// In case the api takes too long to start
		setTimeout(reject, 10_000);
	});

	logger.info('Completed Starting Directus');

	return api;
}
