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
	createDatabase,
	createSharedDatabase,
	dockerDown,
	dockerUp,
	dropSharedDatabase,
	loadSchema,
	saveSchema,
	type SharedDatabase,
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
		/**
		 * Reuse a long lived database container instead of starting a new one, creating a fresh user and database inside of it.
		 * The user and database are dropped on stop, the container is kept running. Defaults to the `SANDBOX_SHARED` env var.
		 */
		shared: boolean;
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
				shared: false,
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
	const sharedDatabases: { shared: SharedDatabase; logger: Logger }[] = [];

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
					const project = await dockerUp(database, opts, env, logger);
					if (project) projects.push({ project, logger, env, keep: opts.docker.keep });

					// Shared databases are cloned from an already bootstrapped template
					const shared = opts.docker.shared ? await createSharedDatabase(database, opts, env, logger) : undefined;

					if (shared) sharedDatabases.push({ shared, logger });
					else await bootstrap(opts, env, logger);
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

		// The apis have to let go of their connections before their database can be dropped
		if (sharedDatabases.length > 0) {
			await Promise.all(sandboxes.flatMap((sandbox) => sandbox.apis.map((api) => killAndWait(api.process))));
		}

		await Promise.all([
			...projects.filter(({ keep }) => !keep).map(({ project, logger, env }) => dockerDown(project, env, logger)),
			...sharedDatabases.map(({ shared, logger }) => dropSharedDatabase(shared, logger)),
		]);
	}

	return { sandboxes, stop, restartApis };
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
	let shared: SharedDatabase | undefined;

	try {
		// Rebuild directus
		if (opts.build && !opts.dev) {
			build = await buildApi(opts, logger, restartApi);
		}

		project = await dockerUp(database, opts, env, logger);
		// Shared databases are cloned from an already bootstrapped template
		if (opts.docker.shared) shared = await createSharedDatabase(database, opts, env, logger);
		if (!shared) await bootstrap(opts, env, logger);
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

		if (shared) {
			// The apis have to let go of their connections before the database can be dropped
			await Promise.all(apis?.map((api) => killAndWait(api.process)) ?? []);
			await dropSharedDatabase(shared, logger);
		}

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
