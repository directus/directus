import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getGlobalDispatcher, MockAgent, setGlobalDispatcher } from 'undici';
import { afterEach, beforeEach, vi } from 'vitest';
import { run } from '../../kernel/run.js';
import type { Snapshot } from '../../sync/contract.js';
import { registerSync } from './index.js';

// The filename keeps shared scaffolding out of Vitest collection.

export const SYNC_URL = 'https://cms.example.com';
export const SYNC_TOKEN = 'super-secret-static-token';

// The owned-file shape written by src/sync/artifact-store.ts: `${slug}_${hash}.json`.
export const OWNED: RegExp = /^[a-z0-9-]*_[0-9a-f]{16}\.json$/;

/** Isolated filesystem, network, environment, and output state for a sync test. */
export interface SyncWorld {
	dir: string;
	agent: MockAgent;
	stdout: string[];
	stderr: string[];
	outsideDir(): string;
}

/**
 * Register fresh filesystem, network, environment, and output isolation for each test.
 */
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

/** Return the minimal full snapshot used by sync command tests. */
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

/** Run sync through the real command dispatcher. */
export function runSync(dir: string, argv: string[]): Promise<number> {
	return run(argv, { registerCommands: [registerSync], cwd: dir });
}

/** Seed the standard staging profile. */
export function seedProjectConfig(dir: string): void {
	writeFileSync(join(dir, 'directus.config.json'), JSON.stringify({ profiles: { staging: { url: SYNC_URL } } }));
}

// Require authentication on the admin-only snapshot endpoint.
export function mockSnapshot(agent: MockAgent, body: unknown): void {
	agent
		.get(SYNC_URL)
		.intercept({ path: '/schema/snapshot', method: 'GET', headers: { authorization: `Bearer ${SYNC_TOKEN}` } })
		.reply(200, { data: body }, { headers: { 'content-type': 'application/json' } });
}

// Register the empty exhaustion probe because QUERY_LIMIT_MAX can silently clamp the first page.
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

	if (records.length > 0) {
		// The exhaustion probe advances by keyset: filter PK strictly greater than the last row served.
		const last = records[records.length - 1]?.['id'];

		agent
			.get(SYNC_URL)
			.intercept({
				path,
				method: 'GET',
				query: { limit: '-1', sort: 'id', filter: JSON.stringify({ id: { _gt: last } }) },
				headers: { authorization: `Bearer ${SYNC_TOKEN}` },
			})
			.reply(200, { data: [] }, { headers: { 'content-type': 'application/json' } });
	} else {
		// An empty first page triggers the zero-cap probe (limit=1); a healthy instance answers 200.
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

	mockSingleton(agent, '/settings', { id: 1 });
}

// Match mode exactly because omitting it selects the server's destructive mirror default.
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

// Capture apply bodies for hash-seal fidelity checks.
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

// Match the server hash-mismatch shape that triggers push's rerun hint.
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

// Undici matches the complete query, proving no unregistered import flags were sent.
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

// The owned artifact whose authoritative `collection` key names the collection — found by content, not
// filename, so a test never hard-codes the hash the store derives.
export function ownedFileFor(dir: string, collection: string): string {
	for (const name of readdirSync(dir).filter((entry) => OWNED.test(entry))) {
		if (JSON.parse(readFileSync(join(dir, name), 'utf8')).collection === collection) return name;
	}

	throw new Error(`no owned file for ${collection}`);
}
