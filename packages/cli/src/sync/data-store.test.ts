import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { type DataCollection, hasCommittedCollection, readDataFiles, writeDataFiles } from './data-store.js';
import { expectCliError } from './test-support.js';

const OWNED = /^[a-z0-9-]*_[0-9a-f]{16}\.json$/;

// The normalized source-instance URL every write now records in metadata.json; push reads it to key the
// ID map's source→target bucket, so the store must round-trip it faithfully.
const SOURCE = 'https://source.example.com';

const dirs: string[] = [];

function tempDir(): string {
	const dir = mkdtempSync(join(tmpdir(), 'd6s-data-'));
	dirs.push(dir);
	return dir;
}

afterEach(() => {
	for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function fixture(): DataCollection[] {
	return [
		{
			collection: 'directus_roles',
			primaryKey: 'id',
			records: [
				{ id: 'b', name: 'Editor', meta: { nested: { order: [3, 1, 2] } } },
				{ id: 'a', name: 'Admin', admin_access: true },
			],
		},
		{
			collection: 'articles',
			primaryKey: 'id',
			records: [
				{ id: '10', title: 'Ten' },
				{ id: '9', title: 'Nine' },
				{ id: '100', title: 'Hundred' },
			],
		},
	];
}

function ownedFileFor(dir: string, collection: string): string {
	for (const name of readdirSync(dir)) {
		if (!OWNED.test(name)) continue;

		const parsed = JSON.parse(readFileSync(join(dir, name), 'utf8'));
		if (parsed.collection === collection) return name;
	}

	throw new Error(`no owned file for ${collection}`);
}

describe('writeDataFiles / readDataFiles', () => {
	it('round-trips records verbatim, including unknown nested keys, sorted by primary key', () => {
		// The store writes the user's own content into their repo; anything it drops is data silently lost
		// from the committed artifact and from the next import. Records come back sorted by PK and
		// collections sorted by name, independent of input order.
		const dir = tempDir();
		writeDataFiles(dir, fixture(), SOURCE);

		const { collections: read } = readDataFiles(dir);

		expect(read.map((collection) => collection.collection)).toEqual(['articles', 'directus_roles']);

		const roles = read.find((collection) => collection.collection === 'directus_roles');

		expect(roles?.records).toEqual([
			{ id: 'a', name: 'Admin', admin_access: true },
			{ id: 'b', name: 'Editor', meta: { nested: { order: [3, 1, 2] } } },
		]);
	});

	it('records the source instance URL and returns it on read', () => {
		// Push learns the source only from the committed data (it knows the target), so the store must
		// persist and return it; a wrong or missing source would key the ID map's bucket wrong and misremap.
		const dir = tempDir();
		writeDataFiles(dir, fixture(), SOURCE);

		expect(readDataFiles(dir).source).toBe(SOURCE);
	});

	it('preserves committed files whose collection is outside the current write set', () => {
		// The fetch set shrinks legitimately (resource-scoped and collection-scoped pulls), and the
		// committed tree is what a later push applies — deleting unfetched collections here silently turned
		// a scoped pull into data loss (found in QA: `pull --flows` wiped roles/policies/dashboards).
		// Removal is a manual act; the writer never deletes what it did not fetch.
		const dir = tempDir();
		writeDataFiles(dir, fixture(), SOURCE);

		const articlesFile = ownedFileFor(dir, 'articles');

		const result = writeDataFiles(
			dir,
			[{ collection: 'directus_flows', primaryKey: 'id', records: [{ id: 'f1', name: 'Nightly' }] }],
			SOURCE,
		);

		expect(result.removed).toEqual([]);
		expect(readFileSync(join(dir, articlesFile), 'utf8')).toContain('Ten');

		const { collections: read } = readDataFiles(dir);

		expect(read.map((collection) => collection.collection)).toEqual(['articles', 'directus_flows', 'directus_roles']);
	});

	it('refuses to write over committed data from a different source instance', () => {
		// Preserved files keep another instance's records, but the manifest names ONE source for the whole
		// set — a cross-source write would relabel them and push would remap through the wrong ID-map
		// bucket. Switching sources must be deliberate: delete the data dir or use a separate project.
		const dir = tempDir();
		writeDataFiles(dir, fixture(), SOURCE);

		const articlesFile = ownedFileFor(dir, 'articles');

		const error = expectCliError(() =>
			writeDataFiles(
				dir,
				[{ collection: 'directus_flows', primaryKey: 'id', records: [{ id: 'f1', name: 'Other' }] }],
				'https://other.example.com',
			),
		);

		expect(error.code).toBe('STATE');
		expect(error.message).toContain(SOURCE);
		expect(error.message).toContain('https://other.example.com');

		// The refusal fires before any write: the committed generation is untouched.
		expect(readFileSync(join(dir, articlesFile), 'utf8')).toContain('Ten');
		expect(readDataFiles(dir).source).toBe(SOURCE);
	});

	it('carries incomplete markers on preserved files and replaces them for fetched collections', () => {
		// The marker is what stands between a truncated export and a mirror deleting the hidden rows. A
		// scoped pull that never touched the truncated collection cannot vouch for it — its marker must
		// survive the write — while re-fetching the collection replaces its state (a clean re-pull clears).
		const dir = tempDir();

		const permissions: DataCollection = {
			collection: 'directus_permissions',
			primaryKey: 'id',
			records: [{ id: 1, policy: 'p1', collection: 'articles', action: 'read' }],
		};

		writeDataFiles(dir, [permissions, ...fixture()], SOURCE, ['directus_permissions']);

		// A scoped pull (flows only) preserves the permissions file — and must preserve its marker.
		const scoped = writeDataFiles(
			dir,
			[{ collection: 'directus_flows', primaryKey: 'id', records: [{ id: 'f1', name: 'Nightly' }] }],
			SOURCE,
		);

		expect(scoped.incomplete).toEqual(['directus_permissions']);
		expect(readDataFiles(dir).incomplete).toEqual(['directus_permissions']);

		// Re-fetching permissions with a clean count replaces the state: the marker clears.
		const clean = writeDataFiles(dir, [permissions], SOURCE);

		expect(clean.incomplete).toEqual([]);
		expect(readDataFiles(dir).incomplete).toEqual([]);
	});

	it('sorts records by primary key as strings, so numeric-looking ids order lexically', () => {
		// The PK sort is codepoint over String(id): "10" and "100" sort before "9". This tradeoff is
		// accepted and asserted deliberately — the store guarantees determinism, not numeric-natural
		// order — so a later "fix" toward numeric sorting that reintroduced nondeterminism fails here.
		const dir = tempDir();

		writeDataFiles(
			dir,
			[{ collection: 'articles', primaryKey: 'id', records: [{ id: '10' }, { id: '9' }, { id: '100' }] }],
			SOURCE,
		);

		const { collections: read } = readDataFiles(dir);

		expect(read[0]?.records.map((record) => record['id'])).toEqual(['10', '100', '9']);
	});
});

describe('hasCommittedCollection', () => {
	it("answers from the committed manifest, tracking the writer's own file naming", () => {
		// Pull consults this to decide whether user-attached access grants ride: a committed users file the
		// writer will preserve means the grants must be kept, or a later mirror push deletes them on the
		// target. The probe derives the same filename as the writer, so this round-trip breaks loudly if
		// the naming scheme ever drifts — a silent false here would re-open that grant drop.
		const dir = tempDir();
		expect(hasCommittedCollection(dir, 'directus_roles')).toBe(false);

		writeDataFiles(dir, fixture(), SOURCE);

		expect(hasCommittedCollection(dir, 'directus_roles')).toBe(true);
		expect(hasCommittedCollection(dir, 'directus_users')).toBe(false);
	});

	it('answers false, never throws, on a corrupt manifest — pull must stay able to heal it', () => {
		// The strict validators already stop any write that builds on a corrupt tree; a read-only premise
		// check must not add a hard-failure path in front of the re-pull that overwrites and heals it.
		const dir = tempDir();
		writeDataFiles(dir, fixture(), SOURCE);
		const metadataPath = join(dir, 'metadata.json');

		writeFileSync(metadataPath, 'not json');
		expect(hasCommittedCollection(dir, 'directus_roles')).toBe(false);

		writeFileSync(metadataPath, JSON.stringify({ source: SOURCE, incomplete: [], files: 'nope' }));
		expect(hasCommittedCollection(dir, 'directus_roles')).toBe(false);
	});
});

describe('readDataFiles failures', () => {
	it('fails loud when metadata predates source tracking, pointing at a re-pull', () => {
		// Data written before the source field existed cannot be pushed safely: the source keys the ID map
		// bucket, and guessing it would misremap. Reading it must fail loud pointing at a re-pull, never
		// silently proceed with an unknown source.
		const dir = tempDir();
		writeDataFiles(dir, fixture(), SOURCE);

		const metadataPath = join(dir, 'metadata.json');
		const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'));
		delete metadata.source;
		writeFileSync(metadataPath, JSON.stringify(metadata));

		const error = expectCliError(() => readDataFiles(dir));

		expect(error.code).toBe('STATE');
		expect(error.hint).toMatch(/pull/i);
	});

	it('fails loud when metadata predates completeness tracking, pointing at a re-pull', () => {
		// An absent `incomplete` field read as "verified complete" would let mirror trust a permissions
		// export that may have been silently truncated before tracking existed. Absence must refuse.
		const dir = tempDir();
		writeDataFiles(dir, fixture(), SOURCE);

		const metadataPath = join(dir, 'metadata.json');
		const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'));
		delete metadata.incomplete;
		writeFileSync(metadataPath, JSON.stringify(metadata));

		const error = expectCliError(() => readDataFiles(dir));

		expect(error.code).toBe('STATE');
		expect(error.message).toContain('completeness');
		expect(error.hint).toMatch(/pull/i);
	});

	it('refuses to write over a manifest with no valid source — never silently adopts it', () => {
		// A pre-source-tracking (or hand-edited) manifest with a valid files list would otherwise be
		// relabeled with THIS pull's source while its preserved files keep another instance's records.
		const dir = tempDir();
		writeDataFiles(dir, fixture(), SOURCE);

		const articlesFile = ownedFileFor(dir, 'articles');
		const metadataPath = join(dir, 'metadata.json');
		const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'));
		delete metadata.source;
		writeFileSync(metadataPath, JSON.stringify(metadata));

		const error = expectCliError(() =>
			writeDataFiles(
				dir,
				[{ collection: 'directus_flows', primaryKey: 'id', records: [{ id: 'f1', name: 'Nightly' }] }],
				SOURCE,
			),
		);

		expect(error.code).toBe('STATE');
		expect(error.message).toContain('source');
		expect(readFileSync(join(dir, articlesFile), 'utf8')).toContain('Ten');
	});

	it('refuses to write over a manifest with a mistyped incomplete marker', () => {
		// A malformed marker must not silently read as "nothing incomplete" — that is exactly the state a
		// mirror refusal depends on.
		const dir = tempDir();
		writeDataFiles(dir, fixture(), SOURCE);

		const metadataPath = join(dir, 'metadata.json');
		const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'));
		metadata.incomplete = 'nope';
		writeFileSync(metadataPath, JSON.stringify(metadata));

		const error = expectCliError(() =>
			writeDataFiles(
				dir,
				[{ collection: 'directus_flows', primaryKey: 'id', records: [{ id: 'f1', name: 'Nightly' }] }],
				SOURCE,
			),
		);

		expect(error.code).toBe('STATE');
		expect(error.message).toContain('incomplete');
	});

	it('refuses a hand-edited source that is not a safe, normalized URL — it flows into reports and map keys', () => {
		// The writer only records normalizeInstanceUrl() of a validated profile URL. A credential-bearing
		// or trailing-slash source can only come from an edit; passing it through would leak it into
		// --json reports and CI logs, or crash as a native URL error inside the ID-map keying.
		for (const source of ['https://user:secret@source.example.com', 'https://source.example.com/']) {
			const dir = tempDir();
			const metadataPath = join(dir, 'metadata.json');
			writeDataFiles(dir, fixture(), SOURCE);

			const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'));
			metadata.source = source;
			writeFileSync(metadataPath, JSON.stringify(metadata));

			const error = expectCliError(() => readDataFiles(dir));

			expect(error.code).toBe('STATE');
			expect(error.message).toContain('source');
			// The refusal must never echo the edited value — that is the leak it exists to prevent.
			expect(error.message).not.toContain(source);
		}
	});

	it('refuses incomplete entries outside the verify-tracked set — they are interpolated into terminal output', () => {
		// Only verify-tracked collections can legitimately carry the marker; anything else is an edit, and
		// the entries reach the mirror refusal and diff warning verbatim.
		const dir = tempDir();
		writeDataFiles(dir, fixture(), SOURCE);

		const metadataPath = join(dir, 'metadata.json');
		const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'));
		metadata.incomplete = ['not-a-tracked-collection'];
		writeFileSync(metadataPath, JSON.stringify(metadata));

		const error = expectCliError(() => readDataFiles(dir));

		expect(error.code).toBe('STATE');
		expect(error.message).toContain('incomplete');
		expect(error.message).not.toContain('not-a-tracked-collection');
	});

	it('treats a pre-tracking manifest as unverified for preserved verify-tracked collections', () => {
		// Nothing ever verified a pre-tracking permissions export. A scoped pull that preserves it must
		// mark it incomplete — laundering it to "complete" via the new manifest would hand mirror a lie.
		// Only a re-fetch (bare pull) may clear the marker.
		const dir = tempDir();

		const permissions: DataCollection = {
			collection: 'directus_permissions',
			primaryKey: 'id',
			records: [{ id: 1, policy: 'p1', collection: 'articles', action: 'read' }],
		};

		writeDataFiles(dir, [permissions, ...fixture()], SOURCE);

		const metadataPath = join(dir, 'metadata.json');
		const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'));
		delete metadata.incomplete;
		writeFileSync(metadataPath, JSON.stringify(metadata));

		const scoped = writeDataFiles(
			dir,
			[{ collection: 'directus_flows', primaryKey: 'id', records: [{ id: 'f1', name: 'Nightly' }] }],
			SOURCE,
		);

		expect(scoped.incomplete).toEqual(['directus_permissions']);
		expect(readDataFiles(dir).incomplete).toEqual(['directus_permissions']);

		// Re-fetching permissions (with a clean verification) replaces the unknown state.
		const clean = writeDataFiles(dir, [permissions], SOURCE);
		expect(clean.incomplete).toEqual([]);
	});

	it('fails loud, naming the file, when an owned file has a non-array "records"', () => {
		// A hand-corrupted `"records": {}` must not read back as a collection with zero records that the
		// next import would treat as the whole set; corruption has to stop at read, naming the file.
		const dir = tempDir();
		writeDataFiles(dir, fixture(), SOURCE);

		const name = ownedFileFor(dir, 'articles');
		const parsed = JSON.parse(readFileSync(join(dir, name), 'utf8'));
		parsed.records = {};
		writeFileSync(join(dir, name), JSON.stringify(parsed));

		const error = expectCliError(() => readDataFiles(dir));

		expect(error.code).toBe('STATE');
		expect(error.message).toContain(name);
		expect(error.message).toMatch(/records/);
	});

	it('fails loud when a record is not an object or has no primary key — junk rows must not import', () => {
		// A `[null]` or PK-less `{}` row would import as a fresh auto-ID record while every real row stays
		// out of the batch — under mirror that is one hand-edit away from deleting the collection. Both
		// refusals stop the read naming the file and the offending record.
		const dir = tempDir();
		writeDataFiles(dir, fixture(), SOURCE);

		const name = ownedFileFor(dir, 'articles');
		const parsed = JSON.parse(readFileSync(join(dir, name), 'utf8'));

		parsed.records = [null];
		writeFileSync(join(dir, name), JSON.stringify(parsed));

		const notObject = expectCliError(() => readDataFiles(dir));
		expect(notObject.code).toBe('STATE');
		expect(notObject.message).toContain(name);
		expect(notObject.message).toContain('not an object');

		parsed.records = [{ title: 'No key' }];
		writeFileSync(join(dir, name), JSON.stringify(parsed));

		const missingPk = expectCliError(() => readDataFiles(dir));
		expect(missingPk.code).toBe('STATE');
		expect(missingPk.message).toContain(name);
		expect(missingPk.message).toContain('primary key');
	});

	it('fails loud on a duplicated primary key — record identity is keyed on it', () => {
		// The ID map, unchanged detection, and mirror survival all key on the PK; two rows sharing one have
		// no single identity and must stop the read rather than race each other through the import.
		const dir = tempDir();
		writeDataFiles(dir, fixture(), SOURCE);

		const name = ownedFileFor(dir, 'articles');
		const parsed = JSON.parse(readFileSync(join(dir, name), 'utf8'));

		parsed.records = [
			{ id: 1, title: 'One' },
			{ id: 1, title: 'Also one' },
		];

		writeFileSync(join(dir, name), JSON.stringify(parsed));

		const error = expectCliError(() => readDataFiles(dir));
		expect(error.code).toBe('STATE');
		expect(error.message).toContain(name);
		expect(error.message).toContain('more than once');
	});
});
