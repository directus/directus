import type { DatabaseClient, DeepPartial } from '@directus/types';
import { createLogger, type Logger } from './logger.js';
import { join } from 'path';
import { merge } from 'lodash-es';
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import { getEnv, type Env } from './config.js';

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
	extras: {
		redis: boolean;
		saml: boolean;
		minio: boolean;
		maildev: boolean;
	};
};

const apiFolder = join(import.meta.dirname, '..', '..', '..', 'api');

export async function sandbox(database: Database, options?: DeepPartial<Options>): Promise<StopSandbox> {
	const logger = createLogger();

	const opts: Options = merge(
		{
			build: false,
			dev: false,
			watch: false,
			port: '8055',
			dockerBasePort: '6000',
			scale: '1',
			env: {} as Record<string, string>,
			extras: {
				redis: false,
				maildev: false,
				minio: false,
				saml: false,
			},
		} satisfies Options,
		options,
	);

	let apis: ChildProcessWithoutNullStreams[] = [];
	const env = getEnv(database, opts);

	// Rebuild directus
	if (opts.build && !opts.dev) {
		buildDirectus(opts, logger, async () => {
			apis.forEach((api) => api.kill());
			apis = await startDirectus(opts, env);
		});
	}

	const project = await dockerUp(database, opts.extras, env, logger);

	await bootstrap(env, logger);

	try {
		apis = await startDirectus(opts, env);
	} catch (e) {
		stop();
		throw e;
	}

	async function stop() {
		await dockerDown(project, logger);
		apis.forEach((api) => api.kill());
		process.exit();
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
			setTimeout(() => reject(new Error('timeout building directus')), 10_000);
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
			},
		},
	);

	logger.pipe(docker.stdout);
	logger.pipe(docker.stderr, 'error');

	await new Promise((resolve) => docker!.on('close', resolve));
	await new Promise((resolve) => setTimeout(resolve, 1_000));

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

async function startDirectus(opts: Options, env: Env) {
	const apiCount = Math.max(1, Number(opts.scale));

	return await Promise.all(
		[...Array(apiCount).keys()].map((i) => {
			const logger = createLogger(`[API${i}]`);
			return startDirectusInstance(opts, { ...env, PORT: String(Number(env.PORT) + i) }, logger);
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
			logger.debug(String(data));

			if (String(data).includes(`Server started at http://${env.HOST}:${env.PORT}`)) {
				resolve(undefined);
				logger.info(String(data));
			}
		});

		// In case the api takes too long to start
		setTimeout(() => {
			reject(new Error('timeout starting directus'));
		}, 10_000);
	});

	logger.info('Completed Starting Directus');

	return api;
}
