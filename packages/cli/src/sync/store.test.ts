import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { CliError } from '../kernel/error.js';
import type { Snapshot, SnapshotEntry, SnapshotFieldEntry } from './contract.js';
import { readSnapshotFiles, writeSnapshotFiles } from './store.js';

const OWNED = /^[a-z0-9-]*_[0-9a-f]{8}\.json$/;

const dirs: string[] = [];

function tempDir(): string {
	const dir = mkdtempSync(join(tmpdir(), 'd6s-store-'));
	dirs.push(dir);
	return dir;
}

afterEach(() => {
	for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

// One realistic snapshot: two user collections carrying nested unknown keys, several
// fields with nested objects, one relation, and a single system field for directus_users.
// The nested `special` array exercises the rule that array order is data (never reordered).
function fixture(): Snapshot {
	return {
		version: 1,
		directus: '11.5.0',
		vendor: 'postgres',
		collections: [
			{ collection: 'articles', meta: { icon: 'article', note: null, sort: 1 }, schema: { name: 'articles' } },
			{ collection: 'authors', meta: { icon: 'person', display_template: '{{ name }}' }, schema: { name: 'authors' } },
		],
		fields: [
			{
				collection: 'articles',
				field: 'title',
				type: 'string',
				meta: { interface: 'input', options: { trim: true } },
				schema: { is_nullable: false },
			},
			{
				collection: 'articles',
				field: 'author',
				type: 'uuid',
				meta: { interface: 'select-dropdown-m2o', special: ['m2o'] },
			},
			{ collection: 'articles', field: 'body', type: 'text', meta: { interface: 'input-rich-text-md' } },
			{ collection: 'authors', field: 'name', type: 'string', meta: { interface: 'input' } },
		],
		systemFields: [
			{ collection: 'directus_users', field: 'favorite_color', type: 'string', meta: { interface: 'select-color' } },
		],
		relations: [
			{
				collection: 'articles',
				field: 'author',
				related_collection: 'authors',
				meta: { one_field: 'articles' },
				schema: { on_delete: 'SET NULL' },
			},
		],
	};
}

function collectionEntry(snapshot: Snapshot, name: string): SnapshotEntry {
	const found = snapshot.collections.find((entry) => entry.collection === name);
	if (found === undefined) throw new Error(`no collection ${name}`);
	return found;
}

function fieldEntry(snapshot: Snapshot, name: string): SnapshotFieldEntry {
	const found = [...snapshot.fields, ...snapshot.systemFields].find((entry) => entry.field === name);
	if (found === undefined) throw new Error(`no field ${name}`);
	return found;
}

// The order the store reassembles into: collections by name, fields by field within each
// collection, system fields split out. Spelled explicitly so a sort regression fails here
// rather than being masked by reusing the module's own ordering.
function canonical(snapshot: Snapshot): Snapshot {
	return {
		version: snapshot.version,
		directus: snapshot.directus,
		vendor: snapshot.vendor,
		collections: [collectionEntry(snapshot, 'articles'), collectionEntry(snapshot, 'authors')],
		fields: [
			fieldEntry(snapshot, 'author'),
			fieldEntry(snapshot, 'body'),
			fieldEntry(snapshot, 'title'),
			fieldEntry(snapshot, 'name'),
		],
		systemFields: [fieldEntry(snapshot, 'favorite_color')],
		relations: snapshot.relations,
	};
}

// Reverse every top-level array and every object's key order at every depth, while leaving
// nested array order intact — the exact transformations the serializer must render invisible.
function shuffle(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(shuffle);

	if (value !== null && typeof value === 'object') {
		const reversed = Object.entries(value as Record<string, unknown>).reverse();
		return Object.fromEntries(reversed.map(([key, inner]) => [key, shuffle(inner)]));
	}

	return value;
}

function shuffled(snapshot: Snapshot): Snapshot {
	return {
		...snapshot,
		collections: shuffle([...snapshot.collections].reverse()) as SnapshotEntry[],
		fields: shuffle([...snapshot.fields].reverse()) as SnapshotFieldEntry[],
		systemFields: shuffle([...snapshot.systemFields].reverse()) as SnapshotFieldEntry[],
		relations: shuffle([...snapshot.relations].reverse()) as SnapshotEntry[],
	};
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

describe('writeSnapshotFiles / readSnapshotFiles', () => {
	it('round-trips a snapshot without losing unknown nested keys', () => {
		// The CLI stores and forwards entries verbatim; anything dropped on the way through
		// the file store is schema data silently lost from the committed artifact.
		const dir = tempDir();
		const fx = fixture();

		writeSnapshotFiles(dir, fx);

		expect(readSnapshotFiles(dir)).toEqual(canonical(fx));
	});

	it('writes byte-identical files regardless of array order or key insertion order', () => {
		// This is the module's reason to exist: a committed artifact must depend only on the
		// schema, so PR diffs surface real changes and never incidental reordering.
		const a = tempDir();
		const b = tempDir();

		writeSnapshotFiles(a, fixture());
		writeSnapshotFiles(b, shuffled(fixture()));

		expect(readAll(a)).toEqual(readAll(b));
	});

	it('is idempotent: a second write changes no bytes and removes nothing', () => {
		const dir = tempDir();
		writeSnapshotFiles(dir, fixture());
		const before = readAll(dir);

		const result = writeSnapshotFiles(dir, fixture());

		expect(readAll(dir)).toEqual(before);
		expect(result.removed).toEqual([]);
	});

	it('removes the owned file of a dropped collection but never a foreign file', () => {
		// Pull mirrors the source; a leftover owned file would resurrect a deleted collection
		// on the next push, while user-authored files must survive untouched.
		const dir = tempDir();
		const fx = fixture();
		writeSnapshotFiles(dir, fx);

		const authorsFile = ownedFileFor(dir, 'authors');
		writeFileSync(join(dir, 'notes.json'), '{ "keep": true }');

		const reduced: Snapshot = {
			...fx,
			collections: fx.collections.filter((entry) => entry.collection !== 'authors'),
			fields: fx.fields.filter((entry) => entry.collection !== 'authors'),
		};

		const result = writeSnapshotFiles(dir, reduced);

		expect(result.removed).toEqual([authorsFile]);
		expect(existsSync(join(dir, authorsFile))).toBe(false);
		expect(existsSync(join(dir, 'notes.json'))).toBe(true);
	});

	it('keeps case-variant collections in separate files on case-insensitive filesystems', () => {
		// `Articles` and `articles` slug identically; only the name hash keeps them apart, so
		// a merge here would silently collapse two distinct collections into one.
		const dir = tempDir();

		writeSnapshotFiles(dir, {
			version: 1,
			directus: '11.5.0',
			vendor: 'postgres',
			collections: [{ collection: 'Articles' }, { collection: 'articles' }],
			fields: [],
			systemFields: [],
			relations: [],
		});

		const owned = readdirSync(dir).filter((name) => OWNED.test(name));

		expect(new Set(owned).size).toBe(2);
	});

	it('round-trips a systemFields entry back into systemFields, never into fields', () => {
		// The fields/systemFields split is server provenance; /schema/apply treats the two buckets
		// differently, so a system field leaking into `fields` would be applied as a user field.
		const dir = tempDir();
		writeSnapshotFiles(dir, fixture());

		const result = readSnapshotFiles(dir);
		const color = fieldEntry(fixture(), 'favorite_color');

		expect(result.systemFields).toContainEqual(color);
		expect(result.fields).not.toContainEqual(color);
	});

	it('round-trips an indexed system field on an ordinary collection through systemFields', () => {
		// systemFields carries indexed system-owned fields that live on ordinary collections — an
		// `articles.id`, not just `directus_*` names (see api get-snapshot: `test.id`/`articles.id`
		// land in systemFields). The collection name never tells the two buckets apart, so the
		// split is provenance that must round-trip verbatim: folding this entry into `fields` would
		// make an apply treat system state as user schema.
		const dir = tempDir();

		const systemField: SnapshotFieldEntry = {
			collection: 'articles',
			field: 'id',
			type: 'integer',
			meta: { system: true },
			schema: { is_indexed: true },
		};

		writeSnapshotFiles(dir, {
			version: 1,
			directus: '11.5.0',
			vendor: 'postgres',
			collections: [{ collection: 'articles' }],
			fields: [{ collection: 'articles', field: 'title', type: 'string' }],
			systemFields: [systemField],
			relations: [],
		});

		const result = readSnapshotFiles(dir);

		expect(result.systemFields).toContainEqual(systemField);
		expect(result.fields).not.toContainEqual(systemField);
	});

	it('never deletes or reads an owned-shaped file it did not write', () => {
		// Ownership is manifest-recorded, not pattern-inferred: a user's own file that happens to
		// match `${slug}_${hash}.json` is absent from metadata's manifest, so a rewrite must not
		// delete it and a read must not fold it in — its corrupt contents would otherwise blow up
		// an otherwise valid read.
		const dir = tempDir();
		writeSnapshotFiles(dir, fixture());

		const planted = join(dir, 'notes_deadbeef.json');
		writeFileSync(planted, '{ "collection": "notes", "fields": "not even an array" }');

		const result = writeSnapshotFiles(dir, fixture());

		expect(result.removed).toEqual([]);
		expect(existsSync(planted)).toBe(true);
		expect(readSnapshotFiles(dir)).toEqual(canonical(fixture()));
	});

	it('preserves a field option literally named __proto__ through write and read', () => {
		// `__proto__` is a legal SQL column and Directus option name. Assigning it with
		// `obj[key] = value` hits the prototype setter and drops the key, so the canonicalizer
		// must create it as an own property — otherwise a committed schema silently loses a real
		// option and the next push would propose removing it from the target.
		const dir = tempDir();

		writeSnapshotFiles(dir, {
			version: 1,
			directus: '11.5.0',
			vendor: 'postgres',
			collections: [{ collection: 'articles' }],
			fields: [
				{
					collection: 'articles',
					field: 'title',
					type: 'string',
					meta: { interface: 'input', options: JSON.parse('{"__proto__": {"kept": true}}') },
				},
			],
			systemFields: [],
			relations: [],
		});

		const serialized = readFileSync(join(dir, ownedFileFor(dir, 'articles')), 'utf8');

		expect(serialized).toContain('"__proto__"');

		const result = readSnapshotFiles(dir);
		const meta = fieldEntry(result, 'title')['meta'] as { options: Record<string, unknown> };

		expect(Object.hasOwn(meta.options, '__proto__')).toBe(true);
		expect(meta.options['__proto__']).toEqual({ kept: true });
	});
});

describe('readSnapshotFiles failures', () => {
	it('reports missing state on an absent directory', () => {
		const error = expectCliError(() => readSnapshotFiles(join(tmpdir(), 'd6s-store-absent-xyz')));

		expect(error.code).toBe('STATE');
		expect(error.hint).toBe('Run d6s sync pull first.');
	});

	it('reports missing state on an empty directory', () => {
		const error = expectCliError(() => readSnapshotFiles(tempDir()));

		expect(error.code).toBe('STATE');
		expect(error.hint).toBe('Run d6s sync pull first.');
	});

	it('fails loud, naming the drifted field, when an owned file is hand-corrupted', () => {
		// A hand-edited artifact that no longer forms a valid snapshot must fail as local
		// STATE with the offending field named, not flow downstream as a plausible object.
		const dir = tempDir();
		writeSnapshotFiles(dir, fixture());

		const name = ownedFileFor(dir, 'articles');
		const parsed = JSON.parse(readFileSync(join(dir, name), 'utf8'));
		delete parsed.fields[0].collection;
		writeFileSync(join(dir, name), JSON.stringify(parsed));

		const error = expectCliError(() => readSnapshotFiles(dir));

		expect(error.code).toBe('STATE');
		expect(error.detail).toMatch(/collection/i);
	});

	it('fails loud, naming the file, when an owned file has a non-array "fields"', () => {
		// A hand-corrupted `"fields": {}` must not read back as a collection with zero fields:
		// parseSnapshot would accept the empty array and the next mirror push would apply it as
		// deleting every real field. Corruption has to stop at read, naming the offending file.
		const dir = tempDir();
		writeSnapshotFiles(dir, fixture());

		const name = ownedFileFor(dir, 'articles');
		const parsed = JSON.parse(readFileSync(join(dir, name), 'utf8'));
		parsed.fields = {};
		writeFileSync(join(dir, name), JSON.stringify(parsed));

		const error = expectCliError(() => readSnapshotFiles(dir));

		expect(error.code).toBe('STATE');
		expect(error.message).toContain(name);
		expect(error.message).toMatch(/fields/);
	});

	it('fails loud, naming the file, when an owned file has a non-array "systemFields"', () => {
		// systemFields is required in every owned file — write always emits it, even as []. A
		// hand-corrupted `"systemFields": {}` must fail at read like a corrupted `fields`, not read
		// back as "no system-field state" that the next mirror push would apply as a deletion.
		const dir = tempDir();
		writeSnapshotFiles(dir, fixture());

		const name = ownedFileFor(dir, 'articles');
		const parsed = JSON.parse(readFileSync(join(dir, name), 'utf8'));
		parsed.systemFields = {};
		writeFileSync(join(dir, name), JSON.stringify(parsed));

		const error = expectCliError(() => readSnapshotFiles(dir));

		expect(error.code).toBe('STATE');
		expect(error.message).toContain(name);
		expect(error.message).toMatch(/systemFields/);
	});

	it('fails loud, naming the file, when the manifest lists a collection file that is gone', () => {
		// The manifest is the authority on membership: a listed file that has vanished from disk is
		// corrupted local state, not an empty collection, and must stop the read naming what is
		// missing rather than silently dropping the collection.
		const dir = tempDir();
		writeSnapshotFiles(dir, fixture());

		const name = ownedFileFor(dir, 'articles');
		rmSync(join(dir, name), { force: true });

		const error = expectCliError(() => readSnapshotFiles(dir));

		expect(error.code).toBe('STATE');
		expect(error.message).toContain(name);
	});
});
