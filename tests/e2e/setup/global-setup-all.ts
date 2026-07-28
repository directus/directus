import util from 'node:util';
import { type Database, databases, type Env, type Options, sandboxes, type Sandboxes } from '@directus/sandbox';
import type { DeepPartial } from '@directus/types';
import { type TestProject } from 'vitest/node';

let sb: Sandboxes | undefined;

const mcpOAuthEnv = {
	MCP_ENABLED: 'true',
	MCP_OAUTH_ENABLED: 'true',
	MCP_OAUTH_DCR_ENABLED: 'true',
	MCP_OAUTH_CIMD_ENABLED: 'true',
	MCP_OAUTH_CIMD_ALLOW_HTTP: 'true',
	MCP_OAUTH_CIMD_BLOCKED_TLDS: 'onion',
	IMPORT_IP_DENY_LIST: '169.254.169.254',
	RATE_LIMITER_MCP_OAUTH_POINTS: '1000',
	RATE_LIMITER_MCP_OAUTH_DURATION: '60',
	RATE_LIMITER_MCP_OAUTH_REGISTRATION_POINTS: '1000',
	RATE_LIMITER_MCP_OAUTH_REGISTRATION_DURATION: '60',
};

export async function setup(project: TestProject) {
	// Enable full depth logging for better error visibility
	util.inspect.defaultOptions.depth = null;

	if (process.env['ALL'] !== 'true') return;

	const ports: number[] = [];

	const dbs = databases.map((database, index) => {
		const port = 8000 + index * 100;
		ports.push(port);
		return {
			database,
			options: {
				prefix: database,
				port: port,
				env: {
					CACHE_SCHEMA: 'false',
					LICENSE_KEY: 'D0000-00000-00000-00000-0000K',
					...mcpOAuthEnv,
				},
				docker: {
					port: port + 10,
					keep: true,
				},
				extras: {
					license: true,
				},
				killPorts: true,
			} as DeepPartial<Options>,
		};
	});

	sb = await sandboxes(dbs);

	project.provide(
		'envs',
		Object.fromEntries(sb.sandboxes.map((sandbox, index) => [dbs[index]!.database, sandbox.env])) as Record<
			Database,
			Env
		>,
	);

	project.provide(
		'options',
		Object.fromEntries(dbs.map((db) => [db.database, db.options])) as Record<Database, DeepPartial<Options>>,
	);

	project.provide(
		'port',
		Object.fromEntries(dbs.map((db) => [db.database, db.options.port])) as Record<Database, number>,
	);
}

export async function teardown(_project: TestProject) {
	if (sb) await sb.stop();
}
