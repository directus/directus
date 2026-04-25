import util from 'node:util';
import { type Database, type Env, type Options, type Sandbox, sandbox } from '@directus/sandbox';
import type { DeepPartial } from '@directus/types';
import { TestProject } from 'vitest/node';

let sb: Sandbox | undefined;

export async function setup(project: TestProject) {
	// Enable full depth logging for better error visibility
	util.inspect.defaultOptions.depth = null;

	if (process.env['ALL'] === 'true') return;

	const database = project.config.env['DATABASE'] as Database;
	const port = project.config.env['PORT']!;
	const devMode = project.config.env['DEV'] === 'true';

	const options: DeepPartial<Options> = {
		port,
		dev: devMode,
		watch: devMode,
		prefix: database,
		env: {
			CACHE_SCHEMA: 'false',
		},
		docker: {
			port: String(Number(project.config.env['PORT']) + 10),
			keep: devMode,
		},
		extras: {
			maildev: true,
			redis: true,
			saml: true,
			minio: true,
		},
		cache: false,
	};

	sb = await sandbox(database, options);

	project.provide('envs', { [database]: sb.env } as Record<Database, Env>);
	project.provide('port', { [database]: sb.apis[0].port } as Record<Database, number>);
	project.provide('options', { [database]: options } as Record<Database, DeepPartial<Options>>);

	return;
}

export async function teardown(_project: TestProject) {
	if (sb) await sb.stop();
}
