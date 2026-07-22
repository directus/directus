import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { MockAgent } from 'undici';
import { run } from '../../kernel/run.js';
import type { Snapshot } from '../../sync/contract.js';
import { registerSync } from './index.js';

// Shared scaffolding for the sync command suites (sync.test.ts and the interactive push/diff suites), kept
// in one home so the config seed, the CLI runner, and the undici mock helpers are written once rather than
// re-declared per describe block. Named *.test-support.ts (not *.test.ts) so vitest never collects it as a
// suite, and — because the build is entry-point-driven from src/bin.ts, which never imports it — it is
// provably absent from the bundle.

export const SYNC_URL = 'https://cms.example.com';
export const SYNC_TOKEN = 'super-secret-static-token';

// The minimal full (version 1) snapshot the schema suites pull, diff, and seed on disk.
export function fullSnapshot(): Snapshot {
	return {
		version: 1,
		directus: '11.0.0',
		vendor: 'postgres',
		collections: [{ collection: 'articles', meta: { note: null } }],
		fields: [{ collection: 'articles', field: 'title', type: 'string' }],
		systemFields: [],
		relations: [],
	};
}

// Drive the whole CLI path through registerSync against a throwaway project dir, exactly as a bin
// invocation would resolve parse → profile → credential → fetch.
export function runSync(dir: string, argv: string[]): Promise<number> {
	return run(argv, { registerCommands: [registerSync], cwd: dir });
}

// The single-profile config every suite seeds before a command runs.
export function seedProjectConfig(dir: string): void {
	writeFileSync(join(dir, 'directus.config.json'), JSON.stringify({ profiles: { staging: { url: SYNC_URL } } }));
}

// The snapshot endpoint is admin-only, so the intercept only matches when the resolved token is on the
// wire — a broken credential path never reaches this reply. The body is passed in so a suite can serve the
// plain full snapshot or a variant (e.g. one carrying a primary key) through the same intercept shape.
export function mockSnapshot(agent: MockAgent, body: unknown): void {
	agent
		.get(SYNC_URL)
		.intercept({ path: '/schema/snapshot', method: 'GET', headers: { authorization: `Bearer ${SYNC_TOKEN}` } })
		.reply(200, { data: body }, { headers: { 'content-type': 'application/json' } });
}

// A list-endpoint record pull: matches only with the whole-set query (limit -1 sorted by primary key) and
// the token on the wire, mirroring fetchRecords.
export function mockList(agent: MockAgent, path: string, records: Record<string, unknown>[]): void {
	agent
		.get(SYNC_URL)
		.intercept({
			path,
			method: 'GET',
			query: { limit: '-1', sort: 'id' },
			headers: { authorization: `Bearer ${SYNC_TOKEN}` },
		})
		.reply(200, { data: records }, { headers: { 'content-type': 'application/json' } });
}

export function mockSingleton(agent: MockAgent, path: string, object: Record<string, unknown>): void {
	agent
		.get(SYNC_URL)
		.intercept({ path, method: 'GET', headers: { authorization: `Bearer ${SYNC_TOKEN}` } })
		.reply(200, { data: object }, { headers: { 'content-type': 'application/json' } });
}

// The default resource set every pull exports (users excluded), stubbed empty with settings a lone object,
// so the data phase of a schema-focused pull has a reply for each request it makes.
export function mockDefaultRecords(agent: MockAgent): void {
	for (const path of [
		'/roles',
		'/policies',
		'/access',
		'/permissions',
		'/flows',
		'/operations',
		'/dashboards',
		'/panels',
		'/translations',
	]) {
		mockList(agent, path, []);
	}

	mockSingleton(agent, '/settings', {});
}
