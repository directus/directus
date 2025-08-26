import { Database, Options, Sandbox, sandbox } from '@directus/sandbox';
import { createDirectus, rest, schemaApply, schemaDiff, staticToken } from '@directus/sdk';
import { Schema } from './schema';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { TestProject } from 'vitest/node';
import { DeepPartial } from '@directus/types';

let sb: Sandbox | undefined;

export async function setup(project: TestProject) {
	if (process.env['ALL'] === 'true') return;

	const database = project.config.env['DATABASE'] as Database;
	const port = project.config.env['PORT'];

	const options: DeepPartial<Options> = {
		port,
		dev: true,
		watch: true,
		prefix: database,
		docker: {
			basePort: String(Number(project.config.env['PORT']) + 10),
			keep: true,
		},
		extras: {
			maildev: false,
			redis: false,
			saml: false,
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
