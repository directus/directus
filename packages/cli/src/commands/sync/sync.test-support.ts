import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getGlobalDispatcher, MockAgent, setGlobalDispatcher } from 'undici';
import { afterEach, beforeEach, vi } from 'vitest';
import { run } from '../../kernel/run.js';
import { registerSync } from './command.js';
import type { Snapshot } from './utils/contract.js';
import { allResources } from './utils/resources.js';

export const SYNC_URL = 'https://cms.example.com';
export const SYNC_TOKEN = 'super-secret-static-token';

export const OWNED: RegExp = /^[a-z0-9-]*_[0-9a-f]{16}\.json$/;

export interface SyncWorld {
	dir: string;
	agent: MockAgent;
	stdout: string[];
	stderr: string[];
	outsideDir(): string;
}

export function useSyncWorld(): SyncWorld {
	const realDispatcher = getGlobalDispatcher();
	const cleanup: string[] = [];
	const stdout: string[] = [];
	const stderr: string[] = [];

	const world: SyncWorld = {
		dir: '',
		agent: undefined as unknown as MockAgent,
		stdout,
		stderr,
		outsideDir: () => {
			const outside = mkdtempSync(join(tmpdir(), 'd6s-outside-'));
			cleanup.push(outside);
			return outside;
		},
	};

	beforeEach(() => {
		world.dir = mkdtempSync(join(tmpdir(), 'd6s-sync-'));
		const home = mkdtempSync(join(tmpdir(), 'd6s-home-'));
		cleanup.push(world.dir, home);
		stdout.length = 0;
		stderr.length = 0;

		world.agent = new MockAgent();
		world.agent.disableNetConnect();
		setGlobalDispatcher(world.agent);

		vi.stubEnv('HOME', home);
		vi.stubEnv('USERPROFILE', home);
		vi.stubEnv('CI', 'true');
		vi.stubEnv('DIRECTUS_STAGING_TOKEN', '');

		vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
			stdout.push(String(chunk));
			return true;
		});

		vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
			stderr.push(String(chunk));
			return true;
		});
	});

	afterEach(async () => {
		setGlobalDispatcher(realDispatcher);
		await world.agent.close();
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
		for (const dir of cleanup.splice(0)) rmSync(dir, { recursive: true, force: true });
	});

	return world;
}

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

export function runSync(dir: string, argv: string[]): Promise<number> {
	return run(argv, { registerCommands: [registerSync], cwd: dir });
}

export function seedProjectConfig(dir: string): void {
	writeFileSync(join(dir, 'directus.config.json'), JSON.stringify({ profiles: { staging: { url: SYNC_URL } } }));
}

export function mockSnapshot(agent: MockAgent, body: unknown): void {
	agent
		.get(SYNC_URL)
		.intercept({ path: '/schema/snapshot', method: 'GET', headers: { authorization: `Bearer ${SYNC_TOKEN}` } })
		.reply(200, { data: body }, { headers: { 'content-type': 'application/json' } });
}

const KEYSET_ENDPOINTS = new Set(
	allResources()
		.filter((resource) => resource.keyset === true)
		.map((resource) => resource.endpoint),
);

const VERIFIED_ENDPOINTS = new Set(
	allResources()
		.filter((resource) => resource.verifyCount === true)
		.map((resource) => resource.endpoint),
);

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

	if (records.length === 1 && !KEYSET_ENDPOINTS.has(path)) {
		agent
			.get(SYNC_URL)
			.intercept({
				path,
				method: 'GET',
				query: { limit: '2', sort: 'id' },
				headers: { authorization: `Bearer ${SYNC_TOKEN}` },
			})
			.reply(200, { data: records }, { headers: { 'content-type': 'application/json' } });
	}

	if (records.length > 0 && KEYSET_ENDPOINTS.has(path)) {
		agent
			.get(SYNC_URL)
			.intercept({
				path,
				method: 'GET',
				query: {
					limit: '-1',
					sort: 'id',
					filter: JSON.stringify({ id: { _gt: records[records.length - 1]!['id'] } }),
				},
				headers: { authorization: `Bearer ${SYNC_TOKEN}` },
			})
			.reply(200, { data: [] }, { headers: { 'content-type': 'application/json' } });
	} else if (records.length > 0) {
		agent
			.get(SYNC_URL)
			.intercept({
				path,
				method: 'GET',
				query: { limit: '-1', sort: 'id', offset: String(records.length - 1) },
				headers: { authorization: `Bearer ${SYNC_TOKEN}` },
			})
			.reply(200, { data: [records[records.length - 1]] }, { headers: { 'content-type': 'application/json' } });
	} else {
		agent
			.get(SYNC_URL)
			.intercept({
				path,
				method: 'GET',
				query: { limit: '1', sort: 'id' },
				headers: { authorization: `Bearer ${SYNC_TOKEN}` },
			})
			.reply(200, { data: [] }, { headers: { 'content-type': 'application/json' } });
	}

	if (VERIFIED_ENDPOINTS.has(path)) {
		mockTotalCount(agent, path, records.length);
	}
}

export function mockTotalCount(agent: MockAgent, path: string, total: number): void {
	agent
		.get(SYNC_URL)
		.intercept({
			path,
			method: 'GET',
			query: { limit: '0', meta: 'total_count' },
			headers: { authorization: `Bearer ${SYNC_TOKEN}` },
		})
		.reply(200, { data: [], meta: { total_count: total } }, { headers: { 'content-type': 'application/json' } });
}

/** Pull reads GET /fields whenever it pulls configuration resources, so any test reaching that phase needs this. */
export function mockFields(agent: MockAgent, fields: Record<string, unknown>[]): void {
	agent
		.get(SYNC_URL)
		.intercept({ path: '/fields', method: 'GET', headers: { authorization: `Bearer ${SYNC_TOKEN}` } })
		.reply(200, { data: fields }, { headers: { 'content-type': 'application/json' } });
}

export function mockSingleton(agent: MockAgent, path: string, object: Record<string, unknown>): void {
	agent
		.get(SYNC_URL)
		.intercept({ path, method: 'GET', headers: { authorization: `Bearer ${SYNC_TOKEN}` } })
		.reply(200, { data: object }, { headers: { 'content-type': 'application/json' } });
}

export function mockDefaultRecords(agent: MockAgent): void {
	mockFields(agent, []);

	for (const path of [
		'/roles',
		'/policies',
		'/access',
		'/permissions',
		'/flows',
		'/operations',
		'/dashboards',
		'/panels',
		'/folders',
		'/translations',
	]) {
		mockList(agent, path, []);
	}

	mockSingleton(agent, '/settings', { id: 1 });
}

export function mockDiff(
	agent: MockAgent,
	mode: 'merge' | 'mirror',
	body: Record<string, unknown> | null,
	capture?: (body: unknown) => void,
): void {
	const reply = agent.get(SYNC_URL).intercept({
		path: '/schema/diff',
		method: 'POST',
		query: { mode },
		headers: { authorization: `Bearer ${SYNC_TOKEN}` },
		body(raw: string) {
			capture?.(JSON.parse(raw));
			return true;
		},
	});

	if (body === null) {
		reply.reply(204, '');
	} else {
		reply.reply(200, { data: { hash: 'h1', diff: body } }, { headers: { 'content-type': 'application/json' } });
	}
}

export function mockApply(agent: MockAgent, capture?: (body: unknown) => void): void {
	agent
		.get(SYNC_URL)
		.intercept({
			path: '/schema/apply',
			method: 'POST',
			headers: { authorization: `Bearer ${SYNC_TOKEN}` },
			body(raw: string) {
				capture?.(JSON.parse(raw));
				return true;
			},
		})
		.reply(204, '');
}

export function mockApplyHashMismatch(agent: MockAgent): void {
	agent
		.get(SYNC_URL)
		.intercept({ path: '/schema/apply', method: 'POST' })
		.reply(
			400,
			{
				errors: [
					{
						message:
							"Provided hash does not match the current instance's schema hash, indicating the schema has changed after this diff was generated. Please generate a new diff and try again",
						extensions: { code: 'INVALID_PAYLOAD' },
					},
				],
			},
			{ headers: { 'content-type': 'application/json' } },
		);
}

export function mockImport(
	agent: MockAgent,
	query: Record<string, string>,
	result: Record<string, unknown>,
	status = 200,
	capture?: (form: FormData) => void,
): void {
	agent
		.get(SYNC_URL)
		.intercept({
			path: '/utils/import',
			method: 'POST',
			query,
			headers: { authorization: `Bearer ${SYNC_TOKEN}` },
			body(raw: unknown) {
				if (capture !== undefined) capture(raw as FormData);
				return true;
			},
		})
		.reply(status, result, { headers: { 'content-type': 'application/json' } });
}

export async function decodeBatch(form: FormData | undefined): Promise<unknown> {
	const file = form?.get('file');

	if (file === null || file === undefined || typeof (file as Blob).text !== 'function') {
		throw new Error('no import file part');
	}

	return JSON.parse(await (file as Blob).text());
}

export function ownedFileFor(dir: string, collection: string): string {
	for (const name of readdirSync(dir).filter((entry) => OWNED.test(entry))) {
		if (JSON.parse(readFileSync(join(dir, name), 'utf8')).collection === collection) return name;
	}

	throw new Error(`no owned file for ${collection}`);
}
