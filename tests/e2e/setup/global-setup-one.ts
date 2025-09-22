import { type Database, type Env, type Options, type Sandbox, sandbox } from '@directus/sandbox';
import { createDirectus, rest, schemaApply, schemaDiff, staticToken } from '@directus/sdk';
import type { Schema } from './schema.d.ts';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { TestProject } from 'vitest/node';
import type { DeepPartial } from '@directus/types';
import util from 'node:util';

let sb: Sandbox | undefined;

export async function setup(project: TestProject) {
	// Enable full depth logging for better error visibility
	util.inspect.defaultOptions.depth = null;

	if (process.env['ALL'] === 'true') return;

	const database = project.config.env['DATABASE'] as Database;
	const port = project.config.env['PORT']!;

	const options: DeepPartial<Options> = {
		port,
		dev: true,
		watch: true,
		prefix: database,
		killPorts: true,
		docker: {
			basePort: String(Number(project.config.env['PORT']) + 10),
			keep: true,
		},
		extras: {
			maildev: false,
			redis: true,
			saml: false,
			minio: true,
		},
		cache: true,
	};

	sb = await sandbox(database, options);

	const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));

	const snapshot = JSON.parse(await readFile(join(import.meta.dirname, 'schema.json'), { encoding: 'utf8' }));
	const diff = await api.request(schemaDiff(snapshot, true));
	if (diff) await api.request(schemaApply(diff));

	project.provide('envs', { [database]: sb.env } as Record<Database, Env>);
	project.provide('options', { [database]: options } as Record<Database, DeepPartial<Options>>);

	return;
}

export async function teardown(_project: TestProject) {
	if (sb) await sb.stop();
}
