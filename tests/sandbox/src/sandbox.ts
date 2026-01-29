import type { DatabaseClient, DeepPartial } from '@directus/types';
import { type ChildProcessWithoutNullStreams } from 'child_process';
import { merge } from 'lodash-es';
import { join } from 'path';
import { getEnv, type Env } from './config.js';
import { createLogger, type Logger } from './logger.js';
import {
	buildDirectus,
	bootstrap,
	dockerDown,
	dockerUp,
	loadSchema,
	saveSchema,
	startDirectus,
} from './steps/index.js';
import chalk from 'chalk';
import getPort from 'get-port';
import { directusFolder } from './find-directus.js';

export type { Env } from './config.js';
export type Database = Exclude<DatabaseClient, 'redshift'> | 'maria';

type Port = string | number;

export type Options = {
	/** Rebuild directus from source */
	build: boolean;
	/** Start directus in developer mode. Not compatible with build */
	dev: boolean;
	/** Restart the api when changes are made */
	watch: boolean;
	/** Port to start the api on */
	port: Port;
	/** Which version of the database to use */
	version: string | undefined;
	/** Configure the behavior of the spun up docker container */
	docker: {
		/** Keep containers running when stopping the sandbox */
		keep: boolean;
		/** Minimum port number to use for docker containers */
		basePort: Port | (() => Port | Promise<Port>);
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
	/** Forcefully kills all processes that occupy ports that the api would use */
	killPorts: boolean;
	/** Enable redis,maildev,saml or other extras */
	extras: {
		/** Used for caching, forced to true if instances > 1 */
		redis: boolean;
		/** Auth provider */
		saml: boolean;
		/** Storage provider */
		minio: boolean;
		/** Email server */
		maildev: boolean;
	};
	/** Enable or disable caching */
	cache: boolean;
};

export type Sandboxes = {
	sandboxes: {
		index: number;
		env: Env;
		logger: Logger;
	}[];
	restartApis(): Promise<void>;
	stop(): Promise<void>;
};

export type Sandbox = {
	restartApi(): Promise<void>;
	stop(): Promise<void>;
	env: Env;
	logger: Logger;
};

async function getOptions(options?: DeepPartial<Options>): Promise<Options> {
	if ((options as any)?.schema === true) options!.schema = 'snapshot.json';
	const port = await getPort({ port: 8055 });

	return merge(
		{
			build: false,
			dev: false,
			watch: false,
			port,
			version: undefined,
			docker: {
				keep: false,
				basePort: port + 100,
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
			killPorts: false,
			extras: {
				redis: false,
				maildev: false,
				minio: false,
				saml: false,
			},
			cache: false,
		} satisfies Options,
		options,
	);
}

export const apiFolder = join(directusFolder, 'api');

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
	sandboxes: SandboxesOptions,
	options?: Partial<Pick<Options, 'build' | 'dev' | 'watch'>>,
): Promise<Sandboxes> {
	if (!sandboxes.every((sandbox) => databases.includes(sandbox.database))) throw new Error('Invalid database provided');

	const opts = await getOptions(options);

	const logger = createLogger(process.env as Env, opts);

	let apis: {
		index: number;
		processes: ChildProcessWithoutNullStreams[];
		opts: Options;
		env: Env;
		logger: Logger;
	}[] = [];

	let build: ChildProcessWithoutNullStreams | undefined;
	const projects: { project: string; logger: Logger; env: Env }[] = [];

	try {
		// Rebuild directus
		if (opts.build && !opts.dev) {
			build = await buildDirectus(opts, logger, restartApis);
		}

		await Promise.all(
			sandboxes.map(async ({ database, options }, index) => {
				const opts = await getOptions(options);
				const env = await getEnv(database, opts);
				const logger = opts.prefix ? createLogger(env, opts, opts.prefix) : createLogger(env, opts);

				try {
					const project = await dockerUp(database, opts, env, logger);
					if (project) projects.push({ project, logger, env });

					await bootstrap(env, logger);
					if (opts.schema) await loadSchema(opts.schema, env, logger);

					apis.push({ processes: await startDirectus(opts, env, logger), index, opts, env, logger });
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
		apis.forEach((api) => api.processes.forEach((process) => process.kill()));

		apis = await Promise.all(
			apis.map(async (api) => ({ ...api, processes: await startDirectus(api.opts, api.env, api.logger) })),
		);
	}

	async function stop() {
		build?.kill();
		apis.forEach((api) => api.processes.forEach((process) => process.kill()));
		if (opts.docker.keep)
			await Promise.all(projects.map(({ project, logger, env }) => dockerDown(project, env, logger)));
	}

	return { sandboxes: apis.map(({ env, index, logger }) => ({ index, env, logger })), stop, restartApis };
}

export async function sandbox(database: Database, options?: DeepPartial<Options>): Promise<Sandbox> {
	if (!databases.includes(database)) throw new Error('Invalid database provided');
	const opts = await getOptions(options);

	const env = await getEnv(database, opts);
	const logger = opts.prefix ? createLogger(env, opts, opts.prefix) : createLogger(env, opts);
	let apis: ChildProcessWithoutNullStreams[] = [];
	let project: string | undefined;
	let build: ChildProcessWithoutNullStreams | undefined;
	let interval: NodeJS.Timeout;

	try {
		// Rebuild directus
		if (opts.build && !opts.dev) {
			build = await buildDirectus(opts, logger, restartApi);
		}

		project = await dockerUp(database, opts, env, logger);
		await bootstrap(env, logger);
		if (opts.schema) await loadSchema(opts.schema, env, logger);
		apis = await startDirectus(opts, env, logger);

		if (opts.export) interval = await saveSchema(env);
	} catch (err: any) {
		logger.error(err.toString());
		await stop();
		throw err;
	}

	async function restartApi() {
		apis.forEach((api) => api.kill());
		apis = await startDirectus(opts, env, logger);
	}

	async function stop() {
		const start = performance.now();
		logger.info('Stopping sandbox');
		clearInterval(interval);
		build?.kill();
		apis.forEach((api) => api.kill());
		if (project && !opts.docker.keep) await dockerDown(project, env, logger);
		const time = chalk.gray(`(${Math.round(performance.now() - start)}ms)`);
		logger.info(`Stopped sandbox ${time}`);
	}

	return { stop, restartApi, env, logger };
}
