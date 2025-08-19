import { Database, Env, Sandbox, sandbox } from '@directus/sandbox';
import { createDirectus, rest, schemaApply, schemaDiff, staticToken } from '@directus/sdk';
import { Schema } from './schema';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { TestProject } from 'vitest/node';

let sb: Sandbox | undefined;

export async function setup(project: TestProject) {
	if (process.env['ALL'] === 'true') return;

	const dev = Boolean(project.config.env['DEV']);
	const watch = Boolean(project.config.env['WATCH']);
	const database = project.config.env['DATABASE'] as Database;
	const port = project.config.env['PORT'];

	const options = {
		port,
		dev,
		watch,
		prefix: database,
		dockerBasePort: String(Number(project.config.env['PORT']) + 1),
		extras: {
			maildev: true,
			redis: true,
			saml: true,
		},
	};

	sb = await sandbox(database, options);

	const api = createDirectus<Schema>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));

	const snapshot = JSON.parse(await readFile(join(import.meta.dirname, 'schema.json'), { encoding: 'utf8' }));
	const diff = await api.request(schemaDiff(snapshot, true));
	await api.request(schemaApply(diff));

	project.provide('envs', { [database]: sb.env });
	project.provide('options', { [database]: options });

	return;
}

export async function teardown(_project: TestProject) {
	if (sb) await sb.stop();
}

declare module 'vitest/node' {
	export interface ProvidedContext {
		env: Env;
	}
}
