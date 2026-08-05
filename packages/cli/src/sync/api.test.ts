import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getGlobalDispatcher, MockAgent, setGlobalDispatcher } from 'undici';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResolvedCredential } from '../kernel/config/credentials.js';
import { CliError } from '../kernel/error.js';
import { applyDiff, fetchDiff, fetchRecords, fetchSnapshot, importBatch } from './api.js';
import type { DiffResult, ImportCollectionData, Snapshot } from './contract.js';

const realDispatcher = getGlobalDispatcher();
const token = 'super-secret-static-token';
const credential: ResolvedCredential = { kind: 'token', url: 'https://cms.example.com', token };
let agent: MockAgent;
const created: string[] = [];

beforeEach(() => {
	const home = mkdtempSync(join(tmpdir(), 'd6s-home-'));
	created.push(home);
	vi.stubEnv('HOME', home);
	vi.stubEnv('USERPROFILE', home);

	agent = new MockAgent();
	agent.disableNetConnect();
	setGlobalDispatcher(agent);
});

afterEach(async () => {
	setGlobalDispatcher(realDispatcher);
	await agent.close();
	vi.restoreAllMocks();
	vi.unstubAllEnvs();
	for (const dir of created.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('fetchSnapshot', () => {
	function fullSnapshot(overrides: Record<string, unknown> = {}): Record<string, unknown> {
		return {
			version: 1,
			directus: '11.0.0',
			vendor: 'postgres',
			collections: [{ collection: 'articles', meta: { note: null } }],
			fields: [{ collection: 'articles', field: 'title', type: 'string' }],
			systemFields: [],
			relations: [],
			...overrides,
		};
	}

	it('carries the resolved credential on the admin-only snapshot request and returns a parsed snapshot', async () => {
		agent
			.get('https://cms.example.com')
			.intercept({ path: '/schema/snapshot', method: 'GET', headers: { authorization: `Bearer ${token}` } })
			.reply(200, { data: fullSnapshot() }, { headers: { 'content-type': 'application/json' } });

		const snapshot = await fetchSnapshot(credential);

		expect(snapshot.version).toBe(1);
		expect(snapshot.collections[0]?.collection).toBe('articles');
		expect(snapshot.systemFields).toEqual([]);
	});

	it('sends includeCollections on the wire and returns the parsed partial snapshot', async () => {
		agent
			.get('https://cms.example.com')
			.intercept({
				path: '/schema/snapshot',
				method: 'GET',
				query: { includeCollections: 'articles,authors' },
				headers: { authorization: `Bearer ${token}` },
			})
			.reply(200, { data: fullSnapshot({ version: 2 }) }, { headers: { 'content-type': 'application/json' } });

		const snapshot = await fetchSnapshot(credential, { include: ['articles', 'authors'] });

		expect(snapshot.version).toBe(2);
		expect(snapshot.collections[0]?.collection).toBe('articles');
	});

	it('sends excludeCollections on the wire for the mutually-exclusive exclude scope', async () => {
		agent
			.get('https://cms.example.com')
			.intercept({ path: '/schema/snapshot', method: 'GET', query: { excludeCollections: 'drafts' } })
			.reply(200, { data: fullSnapshot({ version: 2 }) }, { headers: { 'content-type': 'application/json' } });

		const snapshot = await fetchSnapshot(credential, { exclude: ['drafts'] });

		expect(snapshot.version).toBe(2);
	});

	it('routes a 401 to an AUTH error so credential failures surface hints, not a stack trace', async () => {
		agent
			.get('https://cms.example.com')
			.intercept({ path: '/schema/snapshot', method: 'GET' })
			.reply(
				401,
				{ errors: [{ message: 'nope', extensions: { code: 'INVALID_CREDENTIALS' } }] },
				{ headers: { 'content-type': 'application/json' } },
			);

		await expect(fetchSnapshot(credential)).rejects.toMatchObject({ code: 'AUTH' });
	});

	it('fails at the transport boundary, naming the drifted field, when the snapshot shape breaks', async () => {
		const { collections: _collections, ...withoutCollections } = fullSnapshot();

		agent
			.get('https://cms.example.com')
			.intercept({ path: '/schema/snapshot', method: 'GET' })
			.reply(200, { data: withoutCollections }, { headers: { 'content-type': 'application/json' } });

		const error = await fetchSnapshot(credential).catch((error: unknown) => error);

		expect(error).toBeInstanceOf(CliError);
		expect(error).toMatchObject({ code: 'HTTP' });
		expect((error as CliError).detail).toMatch(/collections/i);
	});
});

describe('fetchDiff', () => {
	function snapshot(): Snapshot {
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

	function diffBody(): Record<string, unknown> {
		return {
			collections: [{ collection: 'events', diff: [{ kind: 'N', rhs: { collection: 'events' } }] }],
			fields: [],
			systemFields: [],
			relations: [],
		};
	}

	it('sends the local snapshot unmodified with the mode on the wire, and returns the parsed diff', async () => {
		const local = snapshot();
		let sentBody: string | undefined;

		agent
			.get('https://cms.example.com')
			.intercept({
				path: '/schema/diff',
				method: 'POST',
				query: { mode: 'merge' },
				headers: { authorization: `Bearer ${token}` },
				body(raw: string) {
					sentBody = raw;
					return true;
				},
			})
			.reply(200, { data: { hash: 'abc123', diff: diffBody() } }, { headers: { 'content-type': 'application/json' } });

		const result = await fetchDiff(credential, local, 'merge');

		expect(sentBody && JSON.parse(sentBody)).toEqual(local);
		expect(result?.hash).toBe('abc123');
		expect(result?.diff.collections[0]?.collection).toBe('events');
	});

	it('resolves null on a 204 empty reply, the "no changes" outcome the command keys off', async () => {
		agent
			.get('https://cms.example.com')
			.intercept({ path: '/schema/diff', method: 'POST', query: { mode: 'mirror' } })
			.reply(204, '');

		await expect(fetchDiff(credential, snapshot(), 'mirror')).resolves.toBeNull();
	});

	it('routes a Directus error to a CliError so a failed diff surfaces a hint, not a stack trace', async () => {
		agent
			.get('https://cms.example.com')
			.intercept({ path: '/schema/diff', method: 'POST', query: { mode: 'merge' } })
			.reply(
				500,
				{ errors: [{ message: 'boom', extensions: { code: 'INTERNAL_SERVER_ERROR' } }] },
				{ headers: { 'content-type': 'application/json' } },
			);

		const error = await fetchDiff(credential, snapshot(), 'merge').catch((error: unknown) => error);

		expect(error).toBeInstanceOf(CliError);
		expect(error).toMatchObject({ code: 'HTTP' });
	});

	it('puts force on the wire only when asked — patch drift needs it, and a plain diff must not carry it', async () => {
		const queries: string[] = [];

		agent
			.get('https://cms.example.com')
			.intercept({ path: (path: string) => path.startsWith('/schema/diff'), method: 'POST' })
			.reply(204, (opts) => {
				queries.push(String(opts.path).split('?')[1] ?? '');
				return '';
			})
			.times(2);

		await expect(fetchDiff(credential, snapshot(), 'merge', true)).resolves.toBeNull();
		await expect(fetchDiff(credential, snapshot(), 'merge', false)).resolves.toBeNull();

		expect(queries[0]).toContain('force=true');
		expect(queries[0]).toContain('mode=merge');
		expect(queries[1]).toBe('mode=merge');
	});
});

describe('applyDiff', () => {
	function diffResult(): DiffResult {
		return {
			hash: 'abc123',
			diff: {
				collections: [{ collection: 'events', diff: [{ kind: 'N', rhs: { collection: 'events' } }] }],
				fields: [],
				systemFields: [],
				relations: [],
			},
		};
	}

	it('carries the resolved credential and sends the sealed { hash, diff } to /schema/apply unmodified', async () => {
		const result = diffResult();
		let sentBody: string | undefined;

		agent
			.get('https://cms.example.com')
			.intercept({
				path: '/schema/apply',
				method: 'POST',
				headers: { authorization: `Bearer ${token}` },
				body(raw: string) {
					sentBody = raw;
					return true;
				},
			})
			.reply(204, '');

		await applyDiff(credential, result);

		expect(sentBody && JSON.parse(sentBody)).toEqual({ hash: result.hash, diff: result.diff });
	});
});

describe('fetchRecords', () => {
	it('pulls the whole collection with limit -1 and the token on the wire, returning records verbatim', async () => {
		const records = [
			{ id: 1, title: 'First', meta: { note: null } },
			{ id: 2, title: 'Second' },
		];

		agent
			.get('https://cms.example.com')
			.intercept({
				path: '/items/articles',
				method: 'GET',
				query: { limit: '-1', sort: 'id' },
				headers: { authorization: `Bearer ${token}` },
			})
			.reply(200, { data: records }, { headers: { 'content-type': 'application/json' } });

		agent
			.get('https://cms.example.com')
			.intercept({
				path: '/items/articles',
				method: 'GET',
				query: { limit: '-1', sort: 'id', offset: '1' },
				headers: { authorization: `Bearer ${token}` },
			})
			.reply(200, { data: [records[1]] }, { headers: { 'content-type': 'application/json' } });

		const result = await fetchRecords(credential, {
			endpoint: '/items/articles',
			primaryKey: 'id',
			singleton: false,
		});

		expect(result).toEqual(records);
	});

	it('reads an unbounded instance in a single request, skipping the exhaustion probe', async () => {
		const records = [
			{ id: 1, title: 'First' },
			{ id: 2, title: 'Second' },
		];

		agent
			.get('https://cms.example.com')
			.intercept({
				path: '/items/articles',
				method: 'GET',
				query: { limit: '-1', sort: 'id' },
				headers: { authorization: `Bearer ${token}` },
			})
			.reply(200, { data: records }, { headers: { 'content-type': 'application/json' } });

		const result = await fetchRecords(
			credential,
			{ endpoint: '/items/articles', primaryKey: 'id', singleton: false },
			-1,
		);

		expect(result).toEqual(records);
	});

	it('does not treat an empty unbounded read as needing a zero-cap probe', async () => {
		agent
			.get('https://cms.example.com')
			.intercept({
				path: '/items/articles',
				method: 'GET',
				query: { limit: '-1', sort: 'id' },
				headers: { authorization: `Bearer ${token}` },
			})
			.reply(200, { data: [] }, { headers: { 'content-type': 'application/json' } });

		const result = await fetchRecords(
			credential,
			{ endpoint: '/items/articles', primaryKey: 'id', singleton: false },
			-1,
		);

		expect(result).toEqual([]);
	});

	it('pages past a server row cap until an empty response, so a clamped fetch cannot truncate', async () => {
		const pages: { offset: string | undefined; rows: { id: number }[] }[] = [
			{ offset: undefined, rows: [{ id: 1 }, { id: 2 }] },
			{ offset: '1', rows: [{ id: 2 }, { id: 3 }] },
			{ offset: '2', rows: [{ id: 3 }] },
		];

		for (const { offset, rows } of pages) {
			agent
				.get('https://cms.example.com')
				.intercept({
					path: '/items/articles',
					method: 'GET',
					query: { limit: '-1', sort: 'id', ...(offset === undefined ? {} : { offset }) },
					headers: { authorization: `Bearer ${token}` },
				})
				.reply(200, { data: rows }, { headers: { 'content-type': 'application/json' } });
		}

		const result = await fetchRecords(credential, {
			endpoint: '/items/articles',
			primaryKey: 'id',
			singleton: false,
		});

		expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
	});

	it('pages a keyset endpoint by PK cursor, so server-side row hiding cannot shift a page boundary', async () => {
		const pages = [
			{ filter: undefined, rows: [{ id: 1 }, { id: 2 }] },
			{ filter: JSON.stringify({ id: { _gt: 2 } }), rows: [{ id: 4 }] },
			{ filter: JSON.stringify({ id: { _gt: 4 } }), rows: [] },
		];

		for (const { filter, rows } of pages) {
			agent
				.get('https://cms.example.com')
				.intercept({
					path: '/permissions',
					method: 'GET',
					query: { limit: '-1', sort: 'id', ...(filter === undefined ? {} : { filter }) },
					headers: { authorization: `Bearer ${token}` },
				})
				.reply(200, { data: rows }, { headers: { 'content-type': 'application/json' } });
		}

		const result = await fetchRecords(credential, {
			endpoint: '/permissions',
			primaryKey: 'id',
			singleton: false,
			keyset: true,
		});

		expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 4 }]);
	});

	it('refuses when a keyset page repeats a primary key — the server ignored the cursor filter', async () => {
		agent
			.get('https://cms.example.com')
			.intercept({
				path: '/permissions',
				method: 'GET',
				query: { limit: '-1', sort: 'id' },
				headers: { authorization: `Bearer ${token}` },
			})
			.reply(200, { data: [{ id: 1 }] }, { headers: { 'content-type': 'application/json' } });

		agent
			.get('https://cms.example.com')
			.intercept({
				path: '/permissions',
				method: 'GET',
				query: { limit: '-1', sort: 'id', filter: JSON.stringify({ id: { _gt: 1 } }) },
				headers: { authorization: `Bearer ${token}` },
			})
			.reply(200, { data: [{ id: 1 }] }, { headers: { 'content-type': 'application/json' } });

		const error = await fetchRecords(credential, {
			endpoint: '/permissions',
			primaryKey: 'id',
			singleton: false,
			keyset: true,
		}).catch((error: unknown) => error);

		expect(error).toBeInstanceOf(CliError);
		expect(error).toMatchObject({ code: 'HTTP' });
		expect((error as CliError).message).toContain('more than once');
	});

	it('probes limit=1 on an empty first page and returns empty when the probe succeeds', async () => {
		agent
			.get('https://cms.example.com')
			.intercept({ path: '/items/articles', method: 'GET', query: { limit: '-1', sort: 'id' } })
			.reply(200, { data: [] }, { headers: { 'content-type': 'application/json' } });

		agent
			.get('https://cms.example.com')
			.intercept({ path: '/items/articles', method: 'GET', query: { limit: '1', sort: 'id' } })
			.reply(200, { data: [] }, { headers: { 'content-type': 'application/json' } });

		const result = await fetchRecords(credential, {
			endpoint: '/items/articles',
			primaryKey: 'id',
			singleton: false,
		});

		expect(result).toEqual([]);
	});

	it('refuses when the limit=1 probe is rejected — a zero cap masks every row as emptiness', async () => {
		agent
			.get('https://cms.example.com')
			.intercept({ path: '/items/articles', method: 'GET', query: { limit: '-1', sort: 'id' } })
			.reply(200, { data: [] }, { headers: { 'content-type': 'application/json' } });

		agent
			.get('https://cms.example.com')
			.intercept({ path: '/items/articles', method: 'GET', query: { limit: '1', sort: 'id' } })
			.reply(
				400,
				{ errors: [{ message: '"limit" must be less than or equal to 0', extensions: { code: 'INVALID_QUERY' } }] },
				{ headers: { 'content-type': 'application/json' } },
			);

		const error = await fetchRecords(credential, {
			endpoint: '/items/articles',
			primaryKey: 'id',
			singleton: false,
		}).catch((error: unknown) => error);

		expect(error).toBeInstanceOf(CliError);
		expect(error).toMatchObject({ code: 'CONFIG' });
		expect((error as CliError).message).toContain('QUERY_LIMIT_MAX');
	});

	it('refuses a known one-row cap outright — the overlap scheme cannot make progress at cap 1', async () => {
		const error = await fetchRecords(
			credential,
			{ endpoint: '/items/articles', primaryKey: 'id', singleton: false },
			1,
		).catch((error: unknown) => error);

		expect(error).toBeInstanceOf(CliError);
		expect(error).toMatchObject({ code: 'CONFIG' });
		expect((error as CliError).message).toContain('QUERY_LIMIT_MAX is 1');
	});

	it('refuses an unknown cap concluding at one row when the limit=2 probe is rejected — cap 1 truncates silently', async () => {
		agent
			.get('https://cms.example.com')
			.intercept({ path: '/items/articles', method: 'GET', query: { limit: '-1', sort: 'id' } })
			.reply(200, { data: [{ id: 1 }] }, { headers: { 'content-type': 'application/json' } });

		agent
			.get('https://cms.example.com')
			.intercept({ path: '/items/articles', method: 'GET', query: { limit: '-1', sort: 'id', offset: '0' } })
			.reply(200, { data: [{ id: 1 }] }, { headers: { 'content-type': 'application/json' } });

		agent
			.get('https://cms.example.com')
			.intercept({ path: '/items/articles', method: 'GET', query: { limit: '2', sort: 'id' } })
			.reply(
				400,
				{ errors: [{ message: '"limit" must be less than or equal to 1', extensions: { code: 'INVALID_QUERY' } }] },
				{ headers: { 'content-type': 'application/json' } },
			);

		const error = await fetchRecords(credential, {
			endpoint: '/items/articles',
			primaryKey: 'id',
			singleton: false,
		}).catch((error: unknown) => error);

		expect(error).toBeInstanceOf(CliError);
		expect(error).toMatchObject({ code: 'CONFIG' });
		expect((error as CliError).message).toContain('QUERY_LIMIT_MAX is 1');
	});

	it('returns a genuine one-row collection after the limit=2 probe answers 200', async () => {
		agent
			.get('https://cms.example.com')
			.intercept({ path: '/items/articles', method: 'GET', query: { limit: '-1', sort: 'id' } })
			.reply(200, { data: [{ id: 1, title: 'Only' }] }, { headers: { 'content-type': 'application/json' } });

		agent
			.get('https://cms.example.com')
			.intercept({ path: '/items/articles', method: 'GET', query: { limit: '-1', sort: 'id', offset: '0' } })
			.reply(200, { data: [{ id: 1, title: 'Only' }] }, { headers: { 'content-type': 'application/json' } });

		agent
			.get('https://cms.example.com')
			.intercept({ path: '/items/articles', method: 'GET', query: { limit: '2', sort: 'id' } })
			.reply(200, { data: [{ id: 1, title: 'Only' }] }, { headers: { 'content-type': 'application/json' } });

		const result = await fetchRecords(credential, {
			endpoint: '/items/articles',
			primaryKey: 'id',
			singleton: false,
		});

		expect(result).toEqual([{ id: 1, title: 'Only' }]);
	});

	it('refuses a listed record that lacks the primary key', async () => {
		agent
			.get('https://cms.example.com')
			.intercept({ path: '/items/articles', method: 'GET', query: { limit: '-1', sort: 'id' } })
			.reply(200, { data: [{ title: 'No key' }] }, { headers: { 'content-type': 'application/json' } });

		const error = await fetchRecords(credential, {
			endpoint: '/items/articles',
			primaryKey: 'id',
			singleton: false,
		}).catch((error: unknown) => error);

		expect(error).toBeInstanceOf(CliError);
		expect(error).toMatchObject({ code: 'HTTP' });
		expect((error as CliError).message).toContain('"id" primary key');
	});

	it('refuses when the overlap row changes between pages — the pages shifted mid-fetch', async () => {
		const pages: { offset: string | undefined; rows: { id: number }[] }[] = [
			{ offset: undefined, rows: [{ id: 1 }] },
			{ offset: '0', rows: [{ id: 2 }] },
		];

		for (const { offset, rows } of pages) {
			agent
				.get('https://cms.example.com')
				.intercept({
					path: '/items/articles',
					method: 'GET',
					query: { limit: '-1', sort: 'id', ...(offset === undefined ? {} : { offset }) },
				})
				.reply(200, { data: rows }, { headers: { 'content-type': 'application/json' } });
		}

		const error = await fetchRecords(credential, {
			endpoint: '/items/articles',
			primaryKey: 'id',
			singleton: false,
		}).catch((error: unknown) => error);

		expect(error).toBeInstanceOf(CliError);
		expect(error).toMatchObject({ code: 'HTTP' });
		expect((error as CliError).message).toContain('shifted while paging');
	});

	it('refuses a primary key repeated within a page', async () => {
		agent
			.get('https://cms.example.com')
			.intercept({ path: '/items/articles', method: 'GET', query: { limit: '-1', sort: 'id' } })
			.reply(200, { data: [{ id: 1 }, { id: 1 }] }, { headers: { 'content-type': 'application/json' } });

		const error = await fetchRecords(credential, {
			endpoint: '/items/articles',
			primaryKey: 'id',
			singleton: false,
		}).catch((error: unknown) => error);

		expect(error).toBeInstanceOf(CliError);
		expect(error).toMatchObject({ code: 'HTTP' });
		expect((error as CliError).message).toContain('more than once');
	});

	it('drops server-derived rows before validation and ends paging when only derived rows remain', async () => {
		const derived = { policy: null, collection: 'directus_settings', action: 'read', system: true };

		agent
			.get('https://cms.example.com')
			.intercept({ path: '/permissions', method: 'GET', query: { limit: '-1', sort: 'id' } })
			.reply(200, { data: [{ id: 1, policy: 'p1' }, derived] }, { headers: { 'content-type': 'application/json' } });

		agent
			.get('https://cms.example.com')
			.intercept({ path: '/permissions', method: 'GET', query: { limit: '-1', sort: 'id', offset: '0' } })
			.reply(200, { data: [{ id: 1, policy: 'p1' }, derived] }, { headers: { 'content-type': 'application/json' } });

		agent
			.get('https://cms.example.com')
			.intercept({ path: '/permissions', method: 'GET', query: { limit: '2', sort: 'id' } })
			.reply(200, { data: [{ id: 1, policy: 'p1' }, derived] }, { headers: { 'content-type': 'application/json' } });

		const result = await fetchRecords(credential, {
			endpoint: '/permissions',
			primaryKey: 'id',
			singleton: false,
			drop: (record) => record['system'] === true,
		});

		expect(result).toEqual([{ id: 1, policy: 'p1' }]);
	});

	it('wraps a singleton object response in a one-element array', async () => {
		agent
			.get('https://cms.example.com')
			.intercept({ path: '/settings', method: 'GET', headers: { authorization: `Bearer ${token}` } })
			.reply(200, { data: { id: 1, project_name: 'Acme' } }, { headers: { 'content-type': 'application/json' } });

		const result = await fetchRecords(credential, {
			endpoint: '/settings',
			primaryKey: 'id',
			singleton: true,
		});

		expect(result).toEqual([{ id: 1, project_name: 'Acme' }]);
	});

	it('refuses a singleton response that lacks the primary key', async () => {
		agent
			.get('https://cms.example.com')
			.intercept({ path: '/settings', method: 'GET' })
			.reply(200, { data: { project_name: 'Acme' } }, { headers: { 'content-type': 'application/json' } });

		const error = await fetchRecords(credential, {
			endpoint: '/settings',
			primaryKey: 'id',
			singleton: true,
		}).catch((error: unknown) => error);

		expect(error).toBeInstanceOf(CliError);
		expect(error).toMatchObject({ code: 'HTTP' });
		expect((error as CliError).message).toContain('"id" primary key');
	});

	it('fails loud, naming the endpoint, when a list endpoint returns a non-array', async () => {
		agent
			.get('https://cms.example.com')
			.intercept({ path: '/items/articles', method: 'GET', query: { limit: '-1', sort: 'id' } })
			.reply(200, { data: { not: 'an array' } }, { headers: { 'content-type': 'application/json' } });

		const error = await fetchRecords(credential, {
			endpoint: '/items/articles',
			primaryKey: 'id',
			singleton: false,
		}).catch((error: unknown) => error);

		expect(error).toBeInstanceOf(CliError);
		expect(error).toMatchObject({ code: 'HTTP' });
		expect((error as CliError).message).toContain('/items/articles');
	});
});

describe('importBatch', () => {
	const batch: ImportCollectionData[] = [{ collection: 'directus_roles', items: [{ id: 't1', name: 'Editor' }] }];

	function errorReply(status: number, extensions: Record<string, unknown>, message = 'failed'): void {
		agent
			.get('https://cms.example.com')
			.intercept({ path: '/utils/import', method: 'POST', query: { mode: 'merge' } })
			.reply(status, { errors: [{ message, extensions }] }, { headers: { 'content-type': 'application/json' } });
	}

	it('uploads the batch as an application/json file with mode on the wire and returns the parsed result', async () => {
		let sentForm: FormData | undefined;

		agent
			.get('https://cms.example.com')
			.intercept({
				path: '/utils/import',
				method: 'POST',
				query: { mode: 'merge' },
				headers: { authorization: `Bearer ${token}` },
				body(raw: unknown) {
					sentForm = raw as FormData;
					return true;
				},
			})
			.reply(
				200,
				{ data: { applied: true, mode: 'merge', collections: {} } },
				{ headers: { 'content-type': 'application/json' } },
			);

		const result = await importBatch(credential, batch, { mode: 'merge' });

		expect(result.applied).toBe(true);

		const file = sentForm?.get('file');
		if (file === null || file === undefined) throw new Error('no file part');

		expect((file as Blob).type).toBe('application/json');
		expect(JSON.parse(await (file as Blob).text())).toEqual(batch);
	});

	it('rides dryRun and dangerouslyAllowDelete on the query only when set', async () => {
		agent
			.get('https://cms.example.com')
			.intercept({
				path: '/utils/import',
				method: 'POST',
				query: { mode: 'merge', dryRun: 'true', dangerouslyAllowDelete: 'true' },
			})
			.reply(
				200,
				{ data: { applied: false, mode: 'merge', collections: {} } },
				{ headers: { 'content-type': 'application/json' } },
			);

		const result = await importBatch(credential, batch, {
			mode: 'merge',
			dryRun: true,
			dangerouslyAllowDelete: true,
		});

		expect(result.applied).toBe(false);
	});

	it('enriches a missing-foreign-key failure with the likely cause', async () => {
		errorReply(400, { code: 'INVALID_FOREIGN_KEY' });

		const error = await importBatch(credential, batch, { mode: 'merge' }).catch((error: unknown) => error);

		expect(error).toBeInstanceOf(CliError);
		expect((error as CliError).hint).toMatch(/referenced record|out-of-scope|unsynced/i);
	});

	it('enriches a cyclical-relation failure by naming the cycle and pointing at the nullable fix', async () => {
		errorReply(422, {
			code: 'IMPORT_CYCLICAL_RELATION',
			collections: ['directus_flows', 'directus_operations'],
			relations: [{ collection: 'directus_flows', field: 'operation', related: 'directus_operations' }],
		});

		const error = await importBatch(credential, batch, { mode: 'merge' }).catch((error: unknown) => error);

		expect(error).toBeInstanceOf(CliError);
		expect((error as CliError).detail).toContain('directus_flows, directus_operations');
		expect((error as CliError).detail).toContain('directus_flows.operation → directus_operations');
		expect((error as CliError).hint).toMatch(/nullable/i);
	});

	it('marks a lost-response import as unknown outcome, steering to diff before any retry', async () => {
		agent
			.get('https://cms.example.com')
			.intercept({ path: '/utils/import', method: 'POST', query: { mode: 'merge' } })
			.replyWithError(new Error('socket hang up'));

		const error = await importBatch(credential, batch, { mode: 'merge' }).catch((error: unknown) => error);

		expect(error).toBeInstanceOf(CliError);
		expect((error as CliError).hint).toContain('may still have been applied');
		expect((error as CliError).hint).toContain('sync diff');
	});
});
