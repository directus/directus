import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { CliError } from '../kernel/error.js';
import { type DataCollection, readDataFiles, writeDataFiles } from './data-store.js';

const OWNED = /^[a-z0-9-]*_[0-9a-f]{16}\.json$/;

const dirs: string[] = [];

function tempDir(): string {
	const dir = mkdtempSync(join(tmpdir(), 'd6s-data-'));
	dirs.push(dir);
	return dir;
}

afterEach(() => {
	for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

// Two collections: a system one whose records carry nested unknown keys (including a nested array whose
// order is data, never reordered), and a user one whose ids are numeric-looking strings so the PK sort's
// string comparison is exercised.
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

// Reverse the collection list, every record array, and every object's key order at every depth, while
// leaving nested array order intact — the exact transformations the store must render invisible.
function shuffleValue(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(shuffleValue);

	if (value !== null && typeof value === 'object') {
		const reversed = Object.entries(value as Record<string, unknown>).reverse();
		return Object.fromEntries(reversed.map(([key, inner]) => [key, shuffleValue(inner)]));
	}

	return value;
}

function shuffled(collections: DataCollection[]): DataCollection[] {
	return [...collections].reverse().map((collection) => ({
		collection: collection.collection,
		primaryKey: collection.primaryKey,
		records: [...collection.records].reverse().map((record) => shuffleValue(record) as Record<string, unknown>),
	}));
}

function readAll(dir: string): Map<string, string> {
	const files = new Map<string, string>();
	for (const name of readdirSync(dir).sort()) files.set(name, readFileSync(join(dir, name), 'utf8'));
	return files;
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
		writeDataFiles(dir, fixture());

		const read = readDataFiles(dir);

		expect(read.map((collection) => collection.collection)).toEqual(['articles', 'directus_roles']);

		const roles = read.find((collection) => collection.collection === 'directus_roles');

		expect(roles?.records).toEqual([
			{ id: 'a', name: 'Admin', admin_access: true },
			{ id: 'b', name: 'Editor', meta: { nested: { order: [3, 1, 2] } } },
		]);
	});

	it('writes byte-identical files regardless of record order or key insertion order', () => {
		// This is the module's reason to exist: a committed data artifact must depend only on the records,
		// so a PR diff surfaces real content changes and never incidental reordering from the export.
		const a = tempDir();
		const b = tempDir();

		writeDataFiles(a, fixture());
		writeDataFiles(b, shuffled(fixture()));

		expect(readAll(a)).toEqual(readAll(b));
	});

	it('sorts records by primary key as strings, so numeric-looking ids order lexically', () => {
		// The PK sort is codepoint over String(id): "10" and "100" sort before "9". This tradeoff is
		// accepted and asserted deliberately — the store guarantees determinism, not numeric-natural
		// order — so a later "fix" toward numeric sorting that reintroduced nondeterminism fails here.
		const dir = tempDir();

		writeDataFiles(dir, [
			{ collection: 'articles', primaryKey: 'id', records: [{ id: '10' }, { id: '9' }, { id: '100' }] },
		]);

		const read = readDataFiles(dir);

		expect(read[0]?.records.map((record) => record['id'])).toEqual(['10', '100', '9']);
	});

	it('is idempotent: a second identical write changes no bytes and removes nothing', () => {
		const dir = tempDir();
		writeDataFiles(dir, fixture());
		const before = readAll(dir);

		const result = writeDataFiles(dir, fixture());

		expect(readAll(dir)).toEqual(before);
		expect(result.removed).toEqual([]);
	});

	it('removes a dropped collection’s owned file but never a foreign one', () => {
		// A data write mirrors the exported set: a leftover owned file would resurrect dropped records on
		// the next read, while a user's own file that merely matches the owned-name shape — absent from
		// the manifest — must survive untouched.
		const dir = tempDir();
		writeDataFiles(dir, fixture());

		const articlesFile = ownedFileFor(dir, 'articles');
		const planted = join(dir, 'notes_deadbeef.json');
		writeFileSync(planted, '{ "collection": "notes", "records": "not even an array" }');

		const result = writeDataFiles(dir, [
			{ collection: 'directus_roles', primaryKey: 'id', records: [{ id: 'a', name: 'Admin' }] },
		]);

		expect(result.removed).toEqual([articlesFile]);
		expect(existsSync(join(dir, articlesFile))).toBe(false);
		expect(existsSync(planted)).toBe(true);
	});
});

describe('readDataFiles failures', () => {
	it('reports missing state on a directory with no data', () => {
		const error = expectCliError(() => readDataFiles(tempDir()));

		expect(error.code).toBe('STATE');
		expect(error.hint).toBe('Run d6s sync pull first.');
	});

	it('fails loud, naming the file, when the manifest lists a data file that is gone', () => {
		// The manifest is the authority on membership: a listed file that has vanished is corrupted local
		// state, not an empty collection, and must stop the read naming what is missing rather than
		// silently dropping the collection.
		const dir = tempDir();
		writeDataFiles(dir, fixture());

		const name = ownedFileFor(dir, 'articles');
		rmSync(join(dir, name), { force: true });

		const error = expectCliError(() => readDataFiles(dir));

		expect(error.code).toBe('STATE');
		expect(error.message).toContain(name);
	});

	it('fails loud, naming the file, when an owned file has a non-array "records"', () => {
		// A hand-corrupted `"records": {}` must not read back as a collection with zero records that the
		// next import would treat as the whole set; corruption has to stop at read, naming the file.
		const dir = tempDir();
		writeDataFiles(dir, fixture());

		const name = ownedFileFor(dir, 'articles');
		const parsed = JSON.parse(readFileSync(join(dir, name), 'utf8'));
		parsed.records = {};
		writeFileSync(join(dir, name), JSON.stringify(parsed));

		const error = expectCliError(() => readDataFiles(dir));

		expect(error.code).toBe('STATE');
		expect(error.message).toContain(name);
		expect(error.message).toMatch(/records/);
	});
});
