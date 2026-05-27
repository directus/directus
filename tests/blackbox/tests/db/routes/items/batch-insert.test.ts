import { randomUUID } from 'node:crypto';
import { getUrl } from '@common/config';
import vendors, { type Vendor } from '@common/get-dbs-to-test';
import type { PrimaryKeyType } from '@common/types';
import { PRIMARY_KEY_TYPES, USER } from '@common/variables';
import { setDirectusEnv } from '@utils/set-directus-env';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { collectionArtists } from './no-relation.seed';

// Vendors where ItemsService.createMany emits a single multi-row INSERT … RETURNING
// (the "reliable batch" path in api/src/services/items.ts).
//
// - All other vendors fall through the per-row loop and emit one INSERT per item.
// - Both paths must produce the same observable result (count, distinct PKs, fields
//   round-trip, explicit PKs preserved) — only the expected number of INSERT
//   statements differs.
// - sqlite3 is included because it sits on top of SQLite ≥ 3.35, where INSERT …
//   RETURNING is supported natively; ItemsService probes the version at runtime and
//   falls back to the loop path on older builds
//   (https://www.sqlite.org/lang_returning.html).
const RETURNING_VENDORS = [
	'postgres',
	'postgres10',
	'cockroachdb',
	'oracle',
	'sqlite3',
	// mssql is opt-in only via DB_MSSQL_TRUST_BATCH_RETURNING (see
	// api/src/database/helpers/capabilities/dialects/mssql.ts). When the env var
	// isn't set — which is the case in CI by default — mssql falls through the
	// per-row loop bucket and emits N INSERTs.
] as const satisfies readonly Vendor[];

function isReliableBatchVendor(vendor: Vendor): boolean {
	return (RETURNING_VENDORS as readonly Vendor[]).includes(vendor);
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Response ordering note:
//
// - POST /items returns `data` via `service.readMany(savedKeys)`.
// - With the DB_DEFAULT_ORDER_READS_BY_PK default in readByQuery, responses for
//   collections with an integer / bigInteger PK are `ORDER BY <primary key> ASC`
//   (unless the caller passes an explicit `sort`); UUID / string PK collections
//   remain plan-dependent.
// - Tests below sort both `expected` and `got` by `name` before deep-equal:
//   - `name` is a stable semantic key across every pkType.
//   - Keeps assertions resilient if the default ordering changes or is turned off
//     (e.g. DB_DEFAULT_ORDER_READS_BY_PK=false).

type Artist = {
	id?: number | string;
	name: string;
	company: string;
};

function buildArtist(
	pkType: PrimaryKeyType,
	index: number,
	nonce: string,
	opts: { explicitId?: boolean } = {},
): Artist {
	const artist: Artist = {
		name: `batch-${index}-${nonce}`,
		company: `co-${index}-${nonce}`,
	};

	if (pkType === 'string') {
		artist.id = `artist-${nonce}-${index}`;
	} else if (opts.explicitId) {
		if (pkType === 'uuid') {
			artist.id = randomUUID();
		} else if (pkType === 'integer') {
			// 1B+ offset stays above per-table AUTO_INCREMENT in fresh test DBs;
			// nonce hash makes consecutive runs use disjoint ranges.
			const nonceNum = parseInt(nonce.replace(/-/g, '').slice(0, 8), 16);
			artist.id = 1_000_000_000 + (nonceNum % 100_000_000) + index;
		}
	}

	return artist;
}

async function resetQueryCounter(vendor: Vendor) {
	await request(getUrl(vendor)).post('/query-counter/reset').set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);
}

const sortByName = (x: { name: string }, y: { name: string }) => x.name.localeCompare(y.name);

async function fetchInsertQueriesForNonce(vendor: Vendor, nonce: string, collection: string) {
	const response = await request(getUrl(vendor))
		.get(`/query-counter/queries`)
		.query({ containsBinding: nonce, containsSql: `insert into` })
		.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

	const data = (response.body.data ?? []) as Array<{ sql: string; bindings: string }>;
	return data.filter((q) => q.sql.toLowerCase().includes(collection.toLowerCase()));
}

describe.each(PRIMARY_KEY_TYPES)('/items batch-insert', (pkType) => {
	const localCollectionArtists = `${collectionArtists}_${pkType}`;

	describe(`pkType: ${pkType}`, () => {
		describe('createMany short-circuits on empty input', () => {
			it.each(vendors)('%s', async (vendor) => {
				const nonce = randomUUID();

				await resetQueryCounter(vendor);

				const response = await request(getUrl(vendor))
					.post(`/items/${localCollectionArtists}`)
					.send([])
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				expect(response.statusCode).toBe(200);
				expect(response.body.data).toEqual([]);

				const inserts = await fetchInsertQueriesForNonce(vendor, nonce, localCollectionArtists);
				expect(inserts).toHaveLength(0);
			});
		});

		describe('createMany returns N items with distinct PKs, fields round-trip', () => {
			it.each(vendors)('%s', async (vendor) => {
				const N = 5;
				const nonce = randomUUID();
				const artists = Array.from({ length: N }, (_, i) => buildArtist(pkType, i, nonce));

				await resetQueryCounter(vendor);

				// Narrow response to the columns this test owns. The shared `no-relation.seed`
				// collection carries additional fields (group, date_published) on upstream
				// that this test doesn't seed and doesn't care about; without fields= the
				// strict `toEqual` below would tip over on those extra props.
				const response = await request(getUrl(vendor))
					.post(`/items/${localCollectionArtists}`)
					.query({ fields: 'id,name,company' })
					.send(artists)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				expect(response.statusCode).toBe(200);

				const expected = artists.map((a) => ({
					id: a.id ?? (pkType === 'integer' ? expect.any(Number) : expect.stringMatching(UUID_REGEX)),
					name: a.name,
					company: a.company,
				}));

				const got = response.body.data as Array<{ id: number | string; name: string; company: string }>;

				if (pkType === 'integer') {
					// Integer-PK collections get DB_DEFAULT_ORDER_READS_BY_PK = ORDER BY pk ASC.
					//
					// - Auto-increment IDs are assigned in insertion order, so PK ASC == input order.
					// - Comparing without any sort actively pins that the default ordering kicked in.
					// - If DB_DEFAULT_ORDER_READS_BY_PK gets disabled or the integer-PK branch in
					//   readByQuery regresses, this assertion fails.
					expect(got).toEqual(expected);
				} else {
					// UUID / string PKs are intentionally excluded from the default sort, so
					// the response is in plan-dependent order. Sort both sides by `name` to
					// compare order-independently.
					expect([...got].sort(sortByName)).toEqual([...expected].sort(sortByName));
				}

				// Engine UNIQUE prevents row-level PK dups; this pins that createMany's
				// PK reassignment reports them back distinctly — catches off-by-one or
				// shuffle regressions in the insertedRows → itemsToInsert mapping at
				// items.ts:430-449.
				expect(new Set(got.map((g) => g.id)).size).toBe(N);

				// Query-count is the only branch: reliable vendors emit one multi-row INSERT,
				// loop-bucket vendors emit one INSERT per row.
				const inserts = await fetchInsertQueriesForNonce(vendor, nonce, localCollectionArtists);
				expect(inserts).toHaveLength(isReliableBatchVendor(vendor) ? 1 : N);
			});
		});

		describe('createOne (single-object POST) returns one item via createMany([one])', () => {
			it.each(vendors)('%s', async (vendor) => {
				const nonce = randomUUID();
				const artist = buildArtist(pkType, 0, nonce);

				await resetQueryCounter(vendor);

				const response = await request(getUrl(vendor))
					.post(`/items/${localCollectionArtists}`)
					.send(artist)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				expect(response.statusCode).toBe(200);
				expect(response.body.data).toMatchObject({ name: artist.name, company: artist.company });

				const inserts = await fetchInsertQueriesForNonce(vendor, nonce, localCollectionArtists);
				expect(inserts).toHaveLength(1);
			});
		});

		if (pkType === 'string') {
			return;
		}

		describe('createMany preserves explicit PKs (homogeneous-explicit batch)', () => {
			it.each(vendors)('%s', async (vendor) => {
				const N = 3;
				const nonce = randomUUID();

				const artists = Array.from({ length: N }, (_, i) => buildArtist(pkType, i, nonce, { explicitId: true }));

				await resetQueryCounter(vendor);

				const response = await request(getUrl(vendor))
					.post(`/items/${localCollectionArtists}`)
					.query({ fields: 'id,name,company' })
					.send(artists)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				// MSSQL: inserting explicit values into an IDENTITY-typed integer PK requires
				// SET IDENTITY_INSERT ON.
				//
				// - Neither knex's mssql querycompiler nor Directus's createMany emits the toggle.
				// - The INSERT fails with SQL Server error 544 ("Cannot insert explicit value for
				//   identity column ... when IDENTITY_INSERT is set to OFF").
				// - We pin the failure here so a future fix (e.g. an mssql override in
				//   api/src/database/helpers/sequence/dialects/) lights up this test.
				if (pkType === 'integer' && vendor === 'mssql') {
					expect(response.statusCode).toBeGreaterThanOrEqual(400);
					expect(Array.isArray(response.body.errors)).toBe(true);
					expect(response.body.errors.length).toBeGreaterThan(0);
					return;
				}

				expect(response.statusCode).toBe(200);

				const expected = artists.map((a) => ({
					// MSSQL's UNIQUEIDENTIFIER column round-trips UUIDs uppercase
					// (Directus's mssql schema helper does .toUpperCase() in formatUUID);
					// our explicit randomUUID() values are lowercase, so adjust expected
					// to match.
					id: pkType === 'uuid' && vendor === 'mssql' ? (a.id as string).toUpperCase() : a.id,
					name: a.name,
					company: a.company,
				}));

				const got = response.body.data as Array<{ id: string | number; name: string; company: string }>;

				if (pkType === 'integer') {
					// Explicit integer IDs are monotonically ascending (1B + nonceHash + index),
					// so PK ASC (DB_DEFAULT_ORDER_READS_BY_PK) puts `got` in the same order as
					// `expected` (input order). Comparing without any sort actively pins that
					// the default ordering kicked in.
					expect(got).toEqual(expected);
				} else {
					// UUID PKs are intentionally excluded from the default sort; response
					// order is plan-dependent. Sort both sides by `name` to compare
					// order-independently.
					expect([...got].sort(sortByName)).toEqual([...expected].sort(sortByName));
				}

				const inserts = await fetchInsertQueriesForNonce(vendor, nonce, localCollectionArtists);
				expect(inserts).toHaveLength(isReliableBatchVendor(vendor) ? 1 : N);
			});
		});

		describe('createMany preserves explicit PKs and auto-generates the rest (mixed batch)', () => {
			it.each(vendors)('%s', async (vendor) => {
				const N = 5;
				const nonce = randomUUID();
				const explicitIndices = new Set([0, 2, 4]);

				const artists: Artist[] = Array.from({ length: N }, (_, i) =>
					buildArtist(pkType, i, nonce, { explicitId: explicitIndices.has(i) }),
				);

				// MSSQL's UNIQUEIDENTIFIER round-trips UUIDs uppercase (Directus's mssql
				// formatUUID does .toUpperCase()); our explicit randomUUID() values are
				// lowercase. Normalize both `expected` and `explicitIds` through this
				// helper so the assertions below match what the server returns.
				const explicitIdFor = (a: Artist) =>
					pkType === 'uuid' && vendor === 'mssql' ? (a.id as string).toUpperCase() : a.id;

				const explicitIds = new Set([...explicitIndices].map((i) => explicitIdFor(artists[i]!)!));

				await resetQueryCounter(vendor);

				const response = await request(getUrl(vendor))
					.post(`/items/${localCollectionArtists}`)
					.query({ fields: 'id,name,company' })
					.send(artists)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				// Same IDENTITY_INSERT limitation as the homogeneous-explicit block —
				// mssql + integer PK can't accept explicit values without the toggle
				// that Directus doesn't emit. Pin the failure.
				if (pkType === 'integer' && vendor === 'mssql') {
					expect(response.statusCode).toBeGreaterThanOrEqual(400);
					expect(Array.isArray(response.body.errors)).toBe(true);
					expect(response.body.errors.length).toBeGreaterThan(0);
					return;
				}

				expect(response.statusCode).toBe(200);

				const autoIdMatcher = pkType === 'integer' ? expect.any(Number) : expect.stringMatching(UUID_REGEX);

				const expected = artists
					.map((a, i) => ({
						id: explicitIndices.has(i) ? explicitIdFor(a) : autoIdMatcher,
						name: a.name,
						company: a.company,
					}))
					.sort(sortByName);

				// PK ASC is dialect-dependent for a mixed-integer batch (postgres/oracle
				// put auto-row small IDs before explicit 1B+ IDs; mysql/maria/sqlite bump
				// AUTO_INCREMENT past explicits so the auto IDs interleave). UUID mixed
				// has random PK order. Either way response order isn't a meaningful
				// invariant to pin here — sort by `name` and compare order-independently.
				const got = [...(response.body.data as Array<{ id: string | number; name: string; company: string }>)].sort(
					sortByName,
				);

				expect(got).toEqual(expected);

				// Engine UNIQUE prevents row-level PK dups; these pin that createMany's
				// PK reassignment reports them back distinctly AND keeps explicit IDs
				// disjoint from auto-gen ones — catches off-by-one or shuffle regressions
				// in the insertedRows → itemsToInsert mapping at items.ts:430-449.
				const allIds = new Set(got.map((g) => g.id));
				expect(allIds.size).toBe(N);
				expect([...allIds].filter((id) => explicitIds.has(id))).toHaveLength(explicitIndices.size);

				const inserts = await fetchInsertQueriesForNonce(vendor, nonce, localCollectionArtists);
				expect(inserts).toHaveLength(isReliableBatchVendor(vendor) ? 1 : N);
			});
		});
	});
});

// MSSQL is opt-in for the batch bucket (see DB_MSSQL_TRUST_BATCH_RETURNING in
// api/src/database/helpers/capabilities/dialects/mssql.ts). The blocks above
// cover the default (loop-bucket) behavior; this block flips the env var via
// the `env-inject` test extension to verify the opt-in path emits one
// multi-row INSERT instead of N per-row ones — on the SAME spawned Directus
// instance, without a restart. See setDirectusEnv() for how that works.
if ((vendors as readonly Vendor[]).includes('mssql')) {
	describe('/items batch-insert: mssql DB_MSSQL_TRUST_BATCH_RETURNING=true (opt-in batch bucket)', () => {
		const vendor: Vendor = 'mssql';
		const localCollectionArtists = `${collectionArtists}_integer`;

		it('createMany emits one multi-row INSERT', async () => {
			// Scope the env flip tightly to this test: setting it in beforeAll keeps
			// trust-batch=true on the shared mssql Directus instance for the entire
			// describe lifecycle, which races against any other test file running
			// concurrently against the same instance (they'd unexpectedly hit the
			// batch path). try/finally narrows the window to this test's body only.
			await setDirectusEnv(vendor, 'DB_MSSQL_TRUST_BATCH_RETURNING', 'true');

			try {
				const N = 5;
				const nonce = randomUUID();
				const artists = Array.from({ length: N }, (_, i) => buildArtist('integer', i, nonce));

				await resetQueryCounter(vendor);

				const response = await request(getUrl(vendor))
					.post(`/items/${localCollectionArtists}`)
					.send(artists)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				expect(response.statusCode).toBe(200);
				expect(response.body.data).toHaveLength(N);

				const inserts = await fetchInsertQueriesForNonce(vendor, nonce, localCollectionArtists);
				expect(inserts).toHaveLength(1);
			} finally {
				await setDirectusEnv(vendor, 'DB_MSSQL_TRUST_BATCH_RETURNING', '');
			}
		});
	});
}
