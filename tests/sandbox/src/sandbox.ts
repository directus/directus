import { type ChildProcessWithoutNullStreams } from 'child_process';
import { join } from 'path';
import type { DatabaseClient, DeepPartial } from '@directus/types';
import chalk from 'chalk';
import type { Knex } from 'knex';
import { merge } from 'lodash-es';
import { type Env, getEnv } from './config.js';
import { directusFolder } from './find-directus.js';
import { kill, killAndWait } from './kill.js';
import { createLogger, type Logger } from './logger.js';
import { getPort, type Port, type PortRange } from './port.js';
import { startApp } from './steps/app.js';
import {
	type Api,
	bootstrap,
	buildApi,
	commitSnapshot,
	createDatabase,
	dockerDown,
	dockerUp,
	findSnapshot,
	loadSchema,
	removeSnapshot,
	saveSchema,
	snapshotBaseImage,
	snapshotEnvKey,
	snapshotImageName,
	startApi,
} from './steps/index.js';

export type { Env } from './config.js';
export type Database = Exclude<DatabaseClient, 'redshift'> | 'maria';

export type Options = {
	/** Rebuild directus from source */
	build: boolean;
	/** Start directus in developer mode. Not compatible with build */
	dev: boolean;
	/** Restart the api when changes are made */
	watch: boolean;
	/** Port to start the api on */
	port: Port | undefined;
	/** Spin up the app in dev mode */
	app: boolean | Port;
	/** Which version of the database to use */
	dbVersion: string | undefined;
	/** Configure the behavior of the spun up docker container */
	docker: {
		/** Keep containers running when stopping the sandbox */
		keep: boolean;
		/** Minimum port number to use for docker containers */
		port: Port | PortRange | undefined;
		/** Overwrite the name of the docker project */
		name: string | undefined;
		/** Adds a suffix to the docker project. Can be used to ensure uniqueness */
		suffix: string;
	};
	/** Horizontally scale the api to a given number of instances */
	instances: string;
	/** Add environment variables that the api should start with */
	env: Record<string, string>;
	/** Prefix the logs, useful when starting multiple sandboxes */
	prefix: string | undefined;
	/** Exports a snapshot and type definition every 2 seconds */
	export: boolean;
	/** Silence all logs except for errors */
	silent: boolean;
	/** Load an additional schema snapshot on startup */
	schema: string | undefined;
	/** Start the api with debugger */
	inspect: boolean;
	/** Enable redis,maildev,saml or other extras */
	extras: {
		/** Used for caching, forced to true if instances > 1 */
		redis: boolean;
		/** Auth provider */
		saml: boolean;
		/** Directory server, used as an auth provider */
		ldap: boolean;
		/** Storage provider */
		rustfs: boolean;
		/** Email server */
		maildev: boolean;
		/** License server */
		license: boolean;
	};
	/** Enable or disable caching */
	cache: boolean;
	/** Skips setting initial admin and owner */
	skipSetup: boolean;
	/** Open a Knex connection for direct db access via `sandbox.knex`. Off by default.  */
	knex: boolean;
	/** Lifecycle hooks */
	hooks: {
		/** Runs after bootstrap (+ load schema) but before the api starts */
		beforeApi?: (ctx: { env: Env; logger: Logger; knex?: Knex | undefined }) => Promise<void> | void;
	};
};

export type Sandboxes = {
	sandboxes: {
		apis: [Api, ...Api[]];
		env: Env;
		project: string | undefined;
		logger: Logger;
		knex?: Knex | undefined;
	}[];
	restartApis(): Promise<void>;
	stop(): Promise<void>;
};

export type Sandbox = {
	restartApi(): Promise<void>;
	stop(): Promise<void>;
	env: Env;
	project: string | undefined;
	apis: [Api, ...Api[]];
	logger: Logger;
	knex?: Knex | undefined;
};

async function getOptions(options?: DeepPartial<Options>): Promise<Options> {
	if ((options as any)?.schema === true) options!.schema = 'snapshot.json';

	const port = await getPort(options?.port ?? process.env['PORT'] ?? 8055);

	if (options?.docker?.name) options.docker.name = options.docker.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
	if (options?.docker?.suffix) options.docker.suffix = options.docker.suffix.toLowerCase().replace(/[^a-z0-9_-]/g, '-');

	return merge(
		{
			build: false,
			dev: false,
			watch: false,
			port,
			app: false,
			dbVersion: undefined,
			docker: {
				keep: false,
				port: undefined,
				name: undefined,
				suffix: '',
			},
			instances: '1',
			inspect: true,
			env: {} as Record<string, string>,
			prefix: undefined,
			schema: undefined,
			silent: false,
			export: false,
			extras: {
				redis: false,
				ldap: false,
				maildev: false,
				rustfs: false,
				saml: false,
				license: false,
			},
			cache: false,
			skipSetup: false,
			knex: false,
			hooks: {},
		} satisfies Options,
		options,
	);
}

export const apiFolder = join(directusFolder, 'api');
export const appFolder = join(directusFolder, 'app');

export const databases: Database[] = [
	'maria',
	'cockroachdb',
	'mssql',
	'mysql',
	'oracle',
	'postgres',
	'sqlite',
] as const;

export type SandboxesOptions = {
	database: Database;
	options: DeepPartial<Omit<Options, 'build' | 'dev' | 'watch' | 'export'>>;
}[];

export async function sandboxes(
	sandboxOptions: SandboxesOptions,
	options?: Partial<Pick<Options, 'build' | 'dev' | 'watch'>>,
): Promise<Sandboxes> {
	if (!sandboxOptions.every((sandbox) => databases.includes(sandbox.database)))
		throw new Error('Invalid database provided');

	const opts = await getOptions(options);

	const logger = createLogger(process.env as Env, opts);

	let sandboxes: {
		apis: [Api, ...Api[]];
		opts: Options;
		env: Env;
		project: string | undefined;
		logger: Logger;
		knex?: Knex | undefined;
	}[] = [];

	let build: ChildProcessWithoutNullStreams | undefined;
	const projects: { project: string; logger: Logger; env: Env; keep: boolean }[] = [];

	try {
		// Rebuild directus
		if (opts.build && !opts.dev) {
			build = await buildApi(opts, logger, restartApis);
		}

		await Promise.all(
			sandboxOptions.map(async ({ database, options }, index) => {
				const opts = await getOptions(options);
				const env = await getEnv(database, opts);
				const logger = opts.prefix ? createLogger(env, opts, opts.prefix) : createLogger(env, opts);
				let knex;

				try {
					const project = await startDatabase(database, opts, env, logger, (project) =>
						projects.push({ project, logger, env, keep: opts.docker.keep }),
					);

					if (opts.schema) await loadSchema(opts.schema, env, logger);
					if (opts.knex) knex = createDatabase(env, logger);
					await opts.hooks.beforeApi?.({ env, logger, knex });
					sandboxes[index] = { apis: await startApi(opts, env, logger), opts, env, logger, knex, project };
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

	async function restartApis() {
		sandboxes.forEach((api) => api.apis.forEach((api) => kill(api.process)));

		sandboxes = await Promise.all(
			sandboxes.map(async (api) => ({ ...api, processes: await startApi(api.opts, api.env, api.logger) })),
		);
	}

	async function stop() {
		kill(build);
		await Promise.all(sandboxes.map((sandbox) => sandbox.knex?.destroy()));

		for (const sandbox of sandboxes) {
			for (const api of sandbox.apis) {
				kill(api.process);
			}
		}

		await Promise.all(
			projects.filter(({ keep }) => !keep).map(({ project, logger, env }) => dockerDown(project, env, logger)),
		);
	}

	return { sandboxes, stop, restartApis };
}

/**
 * Starts the database containers and brings the database into a bootstrapped state,
 * either by starting a matching snapshot image or by running `directus bootstrap`.
 * `onProject` is called as soon as the docker project exists, so it can be torn down if bootstrapping fails.
 */
async function startDatabase(
	database: Database,
	opts: Options,
	env: Env,
	logger: Logger,
	onProject?: (project: string) => void,
) {
	// Kept containers may be reused across runs, so they can't depend on a snapshot that gets removed
	const snapshotImage = opts.docker.keep ? undefined : findSnapshot(database, env);

	const project = await dockerUp(database, opts, env, logger, snapshotImage);
	if (project) onProject?.(project);

	if (snapshotImage) {
		logger.info(`Using bootstrapped database snapshot ${snapshotImage}`);
	} else {
		await bootstrap(opts, env, logger);
	}

	return project;
}

export type Snapshot = {
	/** The committed docker image */
	image: string;
	/** Env vars that make sandboxes in other processes pick up the snapshot */
	env: Record<string, string>;
	remove(): Promise<void>;
};

/**
 * Bootstraps a database once and commits it into a docker image.
 * Sandboxes started while `snapshot.env` is set on `process.env` skip bootstrapping and start from that image instead,
 * as long as they were configured with the same bootstrap inputs (admin credentials, project owner, db version, ...).
 * Returns undefined for databases that don't support snapshots.
 */
export async function snapshot(database: Database, options?: DeepPartial<Options>): Promise<Snapshot | undefined> {
	const opts = await getOptions(merge({}, options, { docker: { keep: false, suffix: 'snapshot' } }));
	const env = await getEnv(database, opts);
	const baseImage = snapshotBaseImage(database, env);

	if (!baseImage) return undefined;

	const logger = opts.prefix ? createLogger(env, opts, opts.prefix) : createLogger(env, opts);
	const image = snapshotImageName(database, env);
	const start = performance.now();

	logger.info(`Creating database snapshot ${image}`);

	// Snapshots only contain the database, extras are started by each sandbox
	const project = await dockerUp(database, { ...opts, extras: {} as Options['extras'] }, env, logger, baseImage);

	try {
		const code = await bootstrap(opts, env, logger);
		// A broken snapshot would fail every sandbox started from it, so don't commit one
		if (code !== 0) throw new Error(`Bootstrapping the snapshot failed with exit code ${code}`);

		await commitSnapshot(project!, database, image, env, logger);
	} finally {
		await dockerDown(project!, env, logger);
	}

	const time = chalk.gray(`(${Math.round(performance.now() - start)}ms)`);
	logger.info(`Created database snapshot ${image} ${time}`);

	return {
		image,
		env: { [snapshotEnvKey(database)]: image },
		remove: () => removeSnapshot(image, env, logger),
	};
}

export async function sandbox(database: Database, options?: DeepPartial<Options>): Promise<Sandbox> {
	if (!databases.includes(database)) throw new Error('Invalid database provided');
	const opts = await getOptions(options);

	const env = await getEnv(database, opts);
	const logger = opts.prefix ? createLogger(env, opts, opts.prefix) : createLogger(env, opts);
	let apis: [Api, ...Api[]] | undefined;
	let app: ChildProcessWithoutNullStreams | undefined;
	let build: ChildProcessWithoutNullStreams | undefined;
	let interval: NodeJS.Timeout;
	let knex: Knex | undefined;
	let project: string | undefined;

	try {
		// Rebuild directus
		if (opts.build && !opts.dev) {
			build = await buildApi(opts, logger, restartApi);
		}

		project = await startDatabase(database, opts, env, logger);
		if (opts.schema) await loadSchema(opts.schema, env, logger);
		if (opts.knex) knex = createDatabase(env, logger);
		await opts.hooks.beforeApi?.({ env, logger, knex });
		apis = await startApi(opts, env, logger);
		if (opts.app !== false) app = await startApp(opts, env, logger);

		if (opts.export) interval = await saveSchema(env);
	} catch (err: any) {
		logger.error(err.toString());
		await stop();
		throw err;
	}

	async function restartApi() {
		// Restart on the same port once the old process is gone, keeping PUBLIC_URL stable
		await Promise.all(apis?.map((api) => killAndWait(api.process)) ?? []);

		apis = await startApi(opts, env, logger);
	}

	async function stop() {
		const start = performance.now();
		logger.info('Stopping sandbox');
		clearInterval(interval);
		kill(build);
		if (knex) await knex.destroy();

		for (const api of apis ?? []) {
			kill(api.process);
		}

		kill(app);

		if (project && !opts.docker.keep) await dockerDown(project, env, logger);

		const time = chalk.gray(`(${Math.round(performance.now() - start)}ms)`);
		logger.info(`Stopped sandbox ${time}`);
	}

	return {
		stop,
		restartApi,
		project,
		env,
		logger,
		// Getter so callers see the current apis after restartApi reassigns the
		// local — destructuring `apis` off the sandbox will still snapshot.
		get apis() {
			return apis!;
		},
		knex,
	};
}
