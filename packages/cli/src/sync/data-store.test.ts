import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { CliError } from '../kernel/error.js';
import { type DataCollection, readDataFiles, writeDataFiles } from './data-store.js';

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

function expectCliError(fn: () => unknown): CliError {
	try {
		fn();
	} catch (error) {
		expect(error).toBeInstanceOf(CliError);
		return error as CliError;
	}

	throw new Error('expected a CliError');
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
