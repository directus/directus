import type { DatabaseClient, DeepPartial, Snapshot } from '@directus/types';
import { createLogger, type Logger } from './logger.js';
import { join } from 'path';
import { camelCase, merge, upperFirst } from 'lodash-es';
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import { getEnv, type Env } from './config.js';
import { writeFile } from 'fs/promises';
import { getRelationInfo } from './relation.js';

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
	schema: boolean;
	extras: {
		redis: boolean;
		saml: boolean;
		minio: boolean;
		maildev: boolean;
	};
};

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
			schema: false,
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

const apiFolder = join(import.meta.dirname, '..', '..', '..', 'api');
const databases = ['cockroachdb', 'maria', 'mssql', 'mysql', 'oracle', 'postgres', 'sqlite'];

export async function sandboxes(
	sandboxes: { database: Database; options: DeepPartial<Omit<Options, 'build' | 'dev' | 'watch' | 'schema'>> }[],
	options?: Partial<Pick<Options, 'build' | 'dev' | 'watch'>>,
): Promise<StopSandbox> {
	if (!sandboxes.every((sandbox) => databases.includes(sandbox.database))) throw new Error('Invalid database provided');

	const opts = getOptions(options);
	const logger = createLogger();
	let apis: { processes: ChildProcessWithoutNullStreams[]; opts: Options; env: Env; logger: Logger }[] = [];
	let build: ChildProcessWithoutNullStreams | undefined;
	const projects: { project: string; logger: Logger; env: Env }[] = [];

	try {
		// Rebuild directus
		if (opts.build && !opts.dev) {
			build = await buildDirectus(opts, logger, async () => {
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

				try {
					const project = await dockerUp(database, opts.extras, env, logger);
					if (project) projects.push({ project, logger, env });

					await bootstrap(env, logger);

					apis.push({ processes: await startDirectus(opts, env, logger), opts, env, logger });
				} catch (e) {
					logger.error(String(e));
					throw e;
				}
			}),
		);
	} catch (e) {
		await stop();
		throw e;
	}

	async function stop() {
		build?.kill();
		apis.forEach((api) => api.processes.forEach((process) => process.kill()));
		await Promise.all(projects.map(({ project, logger, env }) => dockerDown(project, env, logger)));
		process.exit();
	}

	return stop;
}

export async function sandbox(database: Database, options?: DeepPartial<Options>): Promise<StopSandbox> {
	if (!databases.includes(database)) throw new Error('Invalid database provided');
	const opts = getOptions(options);

	const logger = opts.prefix ? createLogger(opts.prefix) : createLogger();
	let apis: ChildProcessWithoutNullStreams[] = [];
	let project: string | undefined;
	let build: ChildProcessWithoutNullStreams | undefined;
	const env = getEnv(database, opts);
	let interval: NodeJS.Timeout;

	try {
		// Rebuild directus
		if (opts.build && !opts.dev) {
			build = await buildDirectus(opts, logger, async () => {
				apis.forEach((api) => api.kill());
				apis = await startDirectus(opts, env, logger);
			});
		}

		project = await dockerUp(database, opts.extras, env, logger);
		await bootstrap(env, logger);
		apis = await startDirectus(opts, env, logger);

		if (opts.schema) interval = await saveSchema(env);
	} catch (err: any) {
		logger.error(err.toString());
		await stop();
		throw err;
	}

	async function stop() {
		clearInterval(interval);
		build?.kill();
		apis.forEach((api) => api.kill());
		if (project) await dockerDown(project, env, logger);
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

	build.on('error', (err) => {
		build.kill();
		throw err;
	});

	logger.info(`BUILD ${build.pid}`);

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

		return build;
	} else {
		logger.pipe(build.stdout);
		await new Promise((resolve) => build.on('close', resolve));
		logger.info('New Build Complete');
		return;
	}
}

async function dockerUp(database: Database, extras: Options['extras'], env: Env, logger: Logger) {
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

	logger.info(`DOCKER ${docker.pid}`);

	logger.pipe(docker.stdout, 'debug');
	logger.pipe(docker.stderr, 'error');

	await new Promise((resolve) => docker!.on('close', resolve));

	if ('DB_PORT' in env) logger.info(`Database started at ${env.DB_HOST}:${env.DB_PORT}`);
	else if ('DB_FILENAME' in env) logger.info(`Database stored at ${env.DB_FILENAME}`);

	return project;
}

async function dockerDown(project: string, env: Env, logger: Logger) {
	logger.info('Stopping docker containers');

	const docker = spawn('docker', ['compose', '-p', project, 'down'], {
		env: { ...env, COMPOSE_STATUS_STDOUT: '1' },
	});

	docker.on('error', (err) => {
		docker.kill();
		throw err;
	});

	logger.info(`DOCKER DOWN ${docker.pid}`);

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

	bootstrap.on('error', (err) => {
		bootstrap.kill();
		throw err;
	});

	logger.info(`BOOTSTRAP ${bootstrap.pid}`);

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
		// tsx must me inside the package.json of the package using this!
		api = spawn(
			/^win/.test(process.platform) ? 'pnpm.cmd' : 'pnpm',
			opts.watch
				? ['tsx', 'watch', '--clear-screen=false', '--inspect', join(apiFolder, 'src', 'start.ts')]
				: ['tsx', '--inspect', join(apiFolder, 'src', 'start.ts')],
			{
				env,
				cwd: apiFolder,
				shell: true,
			},
		);
	} else {
		api = spawn('node', [join(apiFolder, 'dist', 'cli', 'run.js'), 'start'], {
			env,
		});
	}

	api.on('error', (err) => {
		logger.error(err.toString());
		throw err;
	});

	logger.info(`API ${api.pid}`);

	logger.pipe(api.stderr, 'error');

	await new Promise((resolve, reject) => {
		api.stdout.on('data', (data) => {
			const msg = String(data);

			if (msg.includes(`Server started at http://${env.HOST}:${env.PORT}`)) {
				resolve(undefined);
			} else if (msg.includes(`ERROR: Port ${env.PORT} is already in use`)) {
				reject(new Error(msg));
			} else {
				logger.debug(msg);
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

async function saveSchema(env: Env) {
	return setInterval(async () => {
		const data = await fetch(`${env.PUBLIC_URL}/schema/snapshot?access_token=${env.ADMIN_TOKEN}`);
		const snapshot = (await data.json()) as { data: Snapshot };

		const collections = snapshot.data.collections.filter((collection) => collection.schema);

		const schema = `export type Schema = {
	${collections
		.map((collection) => {
			const collectionName = formatCollection(collection.collection);

			if (collection.meta?.singleton) return `${formatField(collection.collection)}: ${collectionName}`;

			return `${formatField(collection.collection)}: ${collectionName}[]`;
		})
		.join('\n	')}
}
`;

		const collectionTypes = collections
			.map((collection) => {
				const collectionName = formatCollection(collection.collection);

				return `export type ${collectionName} = {
	${snapshot.data.fields
		.filter((field) => field.collection === collection.collection)
		.map((field) => {
			const rel = getRelationInfo(snapshot.data.relations, collection.collection, field.field);
			const fieldName = formatField(field.field);

			if (!rel) return `${fieldName}: string | number`;

			const { relation, relationType } = rel;

			if (relationType === 'o2m') {
				return `${fieldName}: (string | number | ${formatCollection(relation.collection)})[]`;
			} else if (relationType === 'm2o') {
				return `${fieldName}: string | number | ${formatCollection(relation.related_collection!)}`;
			} else {
				return `${fieldName}: string | number | ${relation.meta!.one_allowed_collections!.map(formatCollection).join(' | ')}`;
			}
		})
		.join('\n	')}
}`;
			})
			.join('\n');

		await writeFile('schema.d.ts', schema + collectionTypes);
		await writeFile('schema.json', JSON.stringify(snapshot.data, null, 4));
	}, 2000);
}

function formatCollection(title: string) {
	return upperFirst(camelCase(title.replaceAll('_1234', '')));
}

function formatField(title: string) {
	return title.replaceAll('_1234', '');
}
