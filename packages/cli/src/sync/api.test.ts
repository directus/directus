import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getGlobalDispatcher, MockAgent, setGlobalDispatcher } from 'undici';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResolvedCredential } from '../kernel/config/credentials.js';
import { CliError } from '../kernel/error.js';
import { applyDiff, fetchDiff, fetchRecords, fetchSnapshot, importBatch } from './api.js';
import type { DiffResult, ImportCollectionData, Snapshot } from './contract.js';

// One setup for every suite in this file: isolate HOME so nothing reads the developer's real ~/.directus,
// and pin the wire with a fresh MockAgent per test — net connect disabled, so a stray request throws.
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
		// /schema/snapshot is admin-only, so the request must present the resolved token;
		// the intercept only matches when the Authorization header is on the wire.

		agent
			.get('https://cms.example.com')
			.intercept({ path: '/schema/snapshot', method: 'GET', headers: { authorization: `Bearer ${token}` } })
			.reply(200, { data: fullSnapshot() }, { headers: { 'content-type': 'application/json' } });

		const snapshot = await fetchSnapshot(credential);

		expect(snapshot.version).toBe(1);
		expect(snapshot.collections[0]?.collection).toBe('articles');
		// Present as [] on the wire; the parse preserves it verbatim (never defaulted) so callers
		// map over the value the server actually sent.
		expect(snapshot.systemFields).toEqual([]);
	});

	it('sends includeCollections on the wire and returns the parsed partial snapshot', async () => {
		// A scoped pull must reach the query string as a comma-joined list; the intercept only matches
		// when includeCollections is on the wire, and the server tags the reply version 2.

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
		// The exclude variant maps to the other query param; the response is still parsed and its
		// version-2 tag is preserved verbatim, never fabricated.

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
		// A 200 that omits a required field is a protocol break; routing the response through
		// the contract parse makes drift fail loud here rather than downstream.

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
		// The mode must reach the query string: an absent mode silently means destructive `mirror`. And
		// /schema/diff computes against exactly the snapshot the CLI captured, so it must arrive byte-for-byte.

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
		// When the snapshots already match the server answers 204 with no body; that must resolve to null
		// (the diff command's short-circuit), never a failed parse.

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
		// The whole safety model is that the exact diff the server sealed reaches /schema/apply
		// byte-faithful — the server re-checks the hash — so the body must deep-equal the DiffResult,
		// hash and diff untouched. The admin-only intercept only matches with the token on the wire.

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

	it('routes a Directus error to a CliError so a failed apply surfaces a hint, not a stack trace', async () => {
		agent
			.get('https://cms.example.com')
			.intercept({ path: '/schema/apply', method: 'POST' })
			.reply(
				500,
				{ errors: [{ message: 'boom', extensions: { code: 'INTERNAL_SERVER_ERROR' } }] },
				{ headers: { 'content-type': 'application/json' } },
			);

		const error = await applyDiff(credential, diffResult()).catch((error: unknown) => error);

		expect(error).toBeInstanceOf(CliError);
		expect(error).toMatchObject({ code: 'HTTP' });
	});
});

describe('fetchRecords', () => {
	it('pulls the whole collection with limit -1 and the token on the wire, returning records verbatim', async () => {
		// A data pull must fetch the entire set (limit -1) keyed by the primary key; the intercept only
		// matches when both ride the query, and the endpoint is authenticated so the token must be present.
		// The follow-up probe (offset past the page) must come back empty before fetch trusts the set is
		// complete — a QUERY_LIMIT_MAX clamp is silent, so a single response can never prove exhaustion.

		// Two records, out of primary-key order and carrying a nested object: fetch returns them untouched
		// Collection records pass through unchanged; ordering and canonicalization are the store's job.
		const records = [
			{ id: 2, title: 'Second' },
			{ id: 1, title: 'First', meta: { note: null } },
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
				query: { limit: '-1', sort: 'id', offset: '2' },
				headers: { authorization: `Bearer ${token}` },
			})
			.reply(200, { data: [] }, { headers: { 'content-type': 'application/json' } });

		const result = await fetchRecords(credential, {
			collection: 'articles',
			endpoint: '/items/articles',
			primaryKey: 'id',
			singleton: false,
		});

		expect(result).toEqual(records);
	});

	it('pages past a server row cap until an empty response, so a clamped fetch cannot truncate', async () => {
		// A deployment with QUERY_LIMIT_MAX clamps limit -1 down to the cap WITHOUT an error — a single
		// request would silently drop every later row, and downstream that is data loss (mirror deletes
		// what it did not see; the collision guard cannot see an occupied PK beyond the cap). The fetch
		// must keep offsetting past short pages — only an EMPTY page proves exhaustion.

		const pages: Record<string, { id: number }[]> = {
			'0': [{ id: 1 }, { id: 2 }],
			'2': [{ id: 3 }],
			'3': [],
		};

		for (const [offset, rows] of Object.entries(pages)) {
			agent
				.get('https://cms.example.com')
				.intercept({
					path: '/items/articles',
					method: 'GET',
					query: { limit: '-1', sort: 'id', ...(offset === '0' ? {} : { offset }) },
					headers: { authorization: `Bearer ${token}` },
				})
				.reply(200, { data: rows }, { headers: { 'content-type': 'application/json' } });
		}

		const result = await fetchRecords(credential, {
			collection: 'articles',
			endpoint: '/items/articles',
			primaryKey: 'id',
			singleton: false,
		});

		expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
	});

	it('probes limit=1 on an empty first page and returns empty when the probe succeeds', async () => {
		// An empty first page could also be QUERY_LIMIT_MAX=0 clamping limit=-1 to zero rows; only a
		// successful explicit-limit read proves the collection is genuinely empty.
		agent
			.get('https://cms.example.com')
			.intercept({ path: '/items/articles', method: 'GET', query: { limit: '-1', sort: 'id' } })
			.reply(200, { data: [] }, { headers: { 'content-type': 'application/json' } });

		agent
			.get('https://cms.example.com')
			.intercept({ path: '/items/articles', method: 'GET', query: { limit: '1', sort: 'id' } })
			.reply(200, { data: [] }, { headers: { 'content-type': 'application/json' } });

		const result = await fetchRecords(credential, {
			collection: 'articles',
			endpoint: '/items/articles',
			primaryKey: 'id',
			singleton: false,
		});

		expect(result).toEqual([]);
	});

	it('refuses when the limit=1 probe is rejected — a zero cap masks every row as emptiness', async () => {
		// sanitize-query accepts QUERY_LIMIT_MAX=0 (`>= 0`) and clamps limit=-1 to zero rows, while
		// validate-query rejects any explicit limit above the cap. Empty page + rejected probe therefore
		// means a zero cap; continuing would export empty collections that a later mirror push turns into
		// target-row deletions.
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
			collection: 'articles',
			endpoint: '/items/articles',
			primaryKey: 'id',
			singleton: false,
		}).catch((error: unknown) => error);

		expect(error).toBeInstanceOf(CliError);
		expect(error).toMatchObject({ code: 'CONFIG' });
		expect((error as CliError).message).toContain('QUERY_LIMIT_MAX');
	});

	it('refuses a listed record that lacks the primary key', async () => {
		// Field permissions can hide the key column. Without it, pull would write artifacts its own
		// reader refuses and reconcile would key comparisons on the string "undefined" — so the fetch
		// fails before anything downstream sees the rows.
		agent
			.get('https://cms.example.com')
			.intercept({ path: '/items/articles', method: 'GET', query: { limit: '-1', sort: 'id' } })
			.reply(200, { data: [{ title: 'No key' }] }, { headers: { 'content-type': 'application/json' } });

		const error = await fetchRecords(credential, {
			collection: 'articles',
			endpoint: '/items/articles',
			primaryKey: 'id',
			singleton: false,
		}).catch((error: unknown) => error);

		expect(error).toBeInstanceOf(CliError);
		expect(error).toMatchObject({ code: 'HTTP' });
		expect((error as CliError).message).toContain('"id" primary key');
	});

	it('refuses a primary key repeated across offset pages', async () => {
		// A concurrent insert shifts offset pages mid-fetch, so paging can hand back the same row twice.
		// Writing it would produce a duplicate-PK artifact the reader refuses; failing the fetch keeps
		// the export honest and the fix is simply re-running.
		const pages: Record<string, { id: number }[]> = {
			'0': [{ id: 1 }],
			'1': [{ id: 1 }],
		};

		for (const [offset, rows] of Object.entries(pages)) {
			agent
				.get('https://cms.example.com')
				.intercept({
					path: '/items/articles',
					method: 'GET',
					query: { limit: '-1', sort: 'id', ...(offset === '0' ? {} : { offset }) },
				})
				.reply(200, { data: rows }, { headers: { 'content-type': 'application/json' } });
		}

		const error = await fetchRecords(credential, {
			collection: 'articles',
			endpoint: '/items/articles',
			primaryKey: 'id',
			singleton: false,
		}).catch((error: unknown) => error);

		expect(error).toBeInstanceOf(CliError);
		expect(error).toMatchObject({ code: 'HTTP' });
		expect((error as CliError).message).toContain('more than once');
	});

	it('drops server-derived rows before validation and ends paging when only derived rows remain', async () => {
		// The server appends the app-access minimal permissions (system: true, NO id) to every
		// authenticated /permissions read, AFTER limit/offset are applied to the real rows. So every
		// page carries them: they must not trip the key-less refusal, must not count toward the paging
		// offset (the second request asks for offset 1, not 2), and a page of only derived rows means
		// the real rows are exhausted.
		const derived = { policy: null, collection: 'directus_settings', action: 'read', system: true };

		agent
			.get('https://cms.example.com')
			.intercept({ path: '/permissions', method: 'GET', query: { limit: '-1', sort: 'id' } })
			.reply(200, { data: [{ id: 1, policy: 'p1' }, derived] }, { headers: { 'content-type': 'application/json' } });

		agent
			.get('https://cms.example.com')
			.intercept({ path: '/permissions', method: 'GET', query: { limit: '-1', sort: 'id', offset: '1' } })
			.reply(200, { data: [derived] }, { headers: { 'content-type': 'application/json' } });

		const result = await fetchRecords(credential, {
			collection: 'directus_permissions',
			endpoint: '/permissions',
			primaryKey: 'id',
			singleton: false,
			drop: (record) => record['system'] === true,
		});

		expect(result).toEqual([{ id: 1, policy: 'p1' }]);
	});

	it('wraps a singleton object response in a one-element array', async () => {
		// A singleton endpoint (settings) returns one object, not an array; fetchRecords normalizes it to a
		// single-record collection so the store treats it like any other. No limit/sort on the wire.

		agent
			.get('https://cms.example.com')
			.intercept({ path: '/settings', method: 'GET', headers: { authorization: `Bearer ${token}` } })
			.reply(200, { data: { project_name: 'Acme' } }, { headers: { 'content-type': 'application/json' } });

		const result = await fetchRecords(credential, {
			collection: 'directus_settings',
			endpoint: '/settings',
			primaryKey: 'id',
			singleton: true,
		});

		expect(result).toEqual([{ project_name: 'Acme' }]);
	});

	it('fails loud, naming the endpoint, when a list endpoint returns a non-array', async () => {
		// A list endpoint that answers with an object is a protocol break; the boundary check fails HTTP
		// naming the endpoint rather than letting a malformed shape corrupt the export downstream.

		agent
			.get('https://cms.example.com')
			.intercept({ path: '/items/articles', method: 'GET', query: { limit: '-1', sort: 'id' } })
			.reply(200, { data: { not: 'an array' } }, { headers: { 'content-type': 'application/json' } });

		const error = await fetchRecords(credential, {
			collection: 'articles',
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

	// A Directus error reply shaped like the SDK reconstructs it: errors[].extensions carries the code and,
	// for a cyclical failure, the cycle's collections and relations.
	function errorReply(status: number, extensions: Record<string, unknown>, message = 'failed'): void {
		agent
			.get('https://cms.example.com')
			.intercept({ path: '/utils/import', method: 'POST', query: { mode: 'merge' } })
			.reply(status, { errors: [{ message, extensions }] }, { headers: { 'content-type': 'application/json' } });
	}

	it('uploads the batch as an application/json file with mode on the wire and returns the parsed result', async () => {
		// The server reads the FIRST file part (any field name) and requires its mimetype to be
		// application/json; the batch array is its content. mode always rides so the server never falls back
		// to its `add` default. The response is parsed at the boundary.

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
		// The exact query match (undici rejects an extra param) proves both flags reached the wire together —
		// the mirror dry-run's exact option set.

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
		// INVALID_FOREIGN_KEY has no dedicated server check — it surfaces as the DB constraint — so push
		// cannot diagnose it. api.ts adds the actionable cause: an out-of-scope reference or unsynced dependency.

		errorReply(400, { code: 'INVALID_FOREIGN_KEY' });

		const error = await importBatch(credential, batch, { mode: 'merge' }).catch((error: unknown) => error);

		expect(error).toBeInstanceOf(CliError);
		expect((error as CliError).hint).toMatch(/referenced record|out-of-scope|unsynced/i);
	});

	it('enriches a cyclical-relation failure by naming the cycle and pointing at the nullable fix', async () => {
		// A cycle of non-nullable FKs is unresolvable; the CLI must name the collections and relations forming
		// it (from the error extensions) and point at the fix — make one relation nullable.

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
});
