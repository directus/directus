import {
	existsSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	renameSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { CliError } from '../kernel/error.js';
import type { Snapshot, SnapshotEntry, SnapshotFieldEntry, SnapshotRelationEntry } from './contract.js';
import { readSnapshotFiles, writeSnapshotFiles } from './store.js';

const OWNED = /^[a-z0-9-]*_[0-9a-f]{16}\.json$/;

const dirs: string[] = [];

function tempDir(): string {
	const dir = mkdtempSync(join(tmpdir(), 'd6s-store-'));
	dirs.push(dir);
	return dir;
}

afterEach(() => {
	for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

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

function abc(): Snapshot {
	return {
		version: 1,
		directus: '11.5.0',
		vendor: 'postgres',
		collections: [{ collection: 'a' }, { collection: 'b' }, { collection: 'c' }],
		fields: [
			{ collection: 'a', field: 'title', type: 'string' },
			{ collection: 'b', field: 'title', type: 'string' },
			{ collection: 'c', field: 'title', type: 'string' },
		],
		systemFields: [],
		relations: [],
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
		relations: shuffle([...snapshot.relations].reverse()) as SnapshotRelationEntry[],
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

	it('round-trips an unknown top-level snapshot key, namespaced under snapshot in metadata.json', () => {
		// The CLI's verbatim promise reaches the top level: a future server-side key must survive
		// write→read and live under `snapshot` so it can never collide with the `files` manifest key.
		const dir = tempDir();
		const fx: Snapshot = { ...fixture(), foo: { bar: 1 } };

		writeSnapshotFiles(dir, fx);

		const metadata = JSON.parse(readFileSync(join(dir, 'metadata.json'), 'utf8'));
		expect(metadata.snapshot.foo).toEqual({ bar: 1 });
		expect(metadata.foo).toBeUndefined();
		expect(Array.isArray(metadata.files)).toBe(true);

		expect(readSnapshotFiles(dir)['foo']).toEqual({ bar: 1 });
	});

	it('treats absent metadata as a first pull but refuses a corrupt one on the next write', () => {
		// Corrupt ownership state must not orphan files that a later push could resurrect.
		const dir = tempDir();

		expect(() => writeSnapshotFiles(dir, fixture())).not.toThrow();

		writeFileSync(join(dir, 'metadata.json'), '{ not valid json');

		const error = expectCliError(() => writeSnapshotFiles(dir, fixture()));

		expect(error.code).toBe('STATE');
		expect(error.message).toContain('metadata.json');
	});

	it('preserves out-of-scope artifacts when a scoped pull refreshes one collection', () => {
		// Pulling a single collection must never destroy the committed schema around it: A and C are
		// outside the scope, so their bytes and their manifest entries must survive a scoped refresh of B,
		// and the set — still a full schema — must stay tagged version 1.
		const dir = tempDir();
		writeSnapshotFiles(dir, abc());

		const aFile = ownedFileFor(dir, 'a');
		const cFile = ownedFileFor(dir, 'c');
		const aBefore = readFileSync(join(dir, aFile), 'utf8');
		const cBefore = readFileSync(join(dir, cFile), 'utf8');

		const scopedB: Snapshot = {
			version: 2,
			directus: '11.5.0',
			vendor: 'postgres',
			collections: [{ collection: 'b' }],
			fields: [
				{ collection: 'b', field: 'title', type: 'string' },
				{ collection: 'b', field: 'body', type: 'text' },
			],
			systemFields: [],
			relations: [],
		};

		const result = writeSnapshotFiles(dir, scopedB, { inScope: (name) => name === 'b' });

		expect(readFileSync(join(dir, aFile), 'utf8')).toBe(aBefore);
		expect(readFileSync(join(dir, cFile), 'utf8')).toBe(cBefore);
		expect(result.removed).toEqual([]);
		expect(result.written).toContain(ownedFileFor(dir, 'b'));
		expect(result.written).not.toContain(aFile);

		const metadata = JSON.parse(readFileSync(join(dir, 'metadata.json'), 'utf8'));
		expect(metadata.files).toContain(aFile);
		expect(metadata.files).toContain(cFile);
		expect(metadata.snapshot.version).toBe(1);
	});

	it('removes an in-scope collection absent from the response but preserves out-of-scope files', () => {
		// Within its scope a pull is still a mirror: a scoped collection missing from the response was
		// deleted at source and must be removed, while collections outside the scope are left intact.
		const dir = tempDir();
		writeSnapshotFiles(dir, abc());

		const aFile = ownedFileFor(dir, 'a');
		const bFile = ownedFileFor(dir, 'b');
		const cFile = ownedFileFor(dir, 'c');

		const empty: Snapshot = {
			version: 2,
			directus: '11.5.0',
			vendor: 'postgres',
			collections: [],
			fields: [],
			systemFields: [],
			relations: [],
		};

		const result = writeSnapshotFiles(dir, empty, { inScope: (name) => name === 'b' });

		expect(result.removed).toEqual([bFile]);
		expect(existsSync(join(dir, bFile))).toBe(false);
		expect(existsSync(join(dir, aFile))).toBe(true);
		expect(existsSync(join(dir, cFile))).toBe(true);

		const metadata = JSON.parse(readFileSync(join(dir, 'metadata.json'), 'utf8'));
		expect([...metadata.files].sort()).toEqual([aFile, cFile].sort());
	});

	it('tags a partial artifact set version 2 across successive scoped pulls of different collections', () => {
		// A partial set must say so, or a later mirror diff would mass-delete everything it omits. The
		// first scoped pull into an empty dir writes version 2, and pulling a disjoint scope keeps the
		// union tagged version 2 — the response's tag, since nothing here descends from a full set.
		const dir = tempDir();

		const scopedA: Snapshot = {
			version: 2,
			directus: '11.5.0',
			vendor: 'postgres',
			collections: [{ collection: 'a' }],
			fields: [{ collection: 'a', field: 'title', type: 'string' }],
			systemFields: [],
			relations: [],
		};

		writeSnapshotFiles(dir, scopedA, { inScope: (name) => name === 'a' });

		let metadata = JSON.parse(readFileSync(join(dir, 'metadata.json'), 'utf8'));
		expect(metadata.snapshot.version).toBe(2);
		expect(metadata.files).toEqual([ownedFileFor(dir, 'a')]);

		const scopedB: Snapshot = {
			version: 2,
			directus: '11.5.0',
			vendor: 'postgres',
			collections: [{ collection: 'b' }],
			fields: [{ collection: 'b', field: 'title', type: 'string' }],
			systemFields: [],
			relations: [],
		};

		writeSnapshotFiles(dir, scopedB, { inScope: (name) => name === 'b' });

		metadata = JSON.parse(readFileSync(join(dir, 'metadata.json'), 'utf8'));
		expect(metadata.snapshot.version).toBe(2);
		expect([...metadata.files].sort()).toEqual([ownedFileFor(dir, 'a'), ownedFileFor(dir, 'b')].sort());
	});

	it('reads back the full set, not just the last pull, after a scoped refresh', () => {
		// Readers consume the committed set, not the most recent request: after a scoped refresh of one
		// collection the reassembled snapshot must still validate and include the preserved collections.
		const dir = tempDir();
		writeSnapshotFiles(dir, abc());

		const scopedB: Snapshot = {
			version: 2,
			directus: '11.5.0',
			vendor: 'postgres',
			collections: [{ collection: 'b' }],
			fields: [
				{ collection: 'b', field: 'title', type: 'string' },
				{ collection: 'b', field: 'subtitle', type: 'string' },
			],
			systemFields: [],
			relations: [],
		};

		writeSnapshotFiles(dir, scopedB, { inScope: (name) => name === 'b' });

		const read = readSnapshotFiles(dir);

		expect(read.collections.map((entry) => entry.collection).sort()).toEqual(['a', 'b', 'c']);

		expect(
			read.fields
				.filter((entry) => entry.collection === 'b')
				.map((entry) => entry.field)
				.sort(),
		).toEqual(['subtitle', 'title']);

		expect(read.version).toBe(1);
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

	it('refuses a manifest entry that escapes the schema directory and never reads the outside file', () => {
		// Repo content must never point a sync read outside the schema dir: a hand-edited manifest
		// naming `../<name>/outside.json` would read a planted file above the dir. The owned-file
		// charset cannot match a traversal, so the read fails naming the entry before touching it.
		const dir = tempDir();
		writeSnapshotFiles(dir, fixture());

		const outsideDir = tempDir();
		const outside = join(outsideDir, 'outside.json');
		writeFileSync(outside, JSON.stringify({ collection: 'secret', fields: [], systemFields: [], relations: [] }));

		const traversal = relative(dir, outside);
		const metadataPath = join(dir, 'metadata.json');
		const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'));
		metadata.files.push(traversal);
		writeFileSync(metadataPath, JSON.stringify(metadata));

		const error = expectCliError(() => readSnapshotFiles(dir));

		expect(error.code).toBe('STATE');
		expect(error.message).toContain(traversal);
	});

	it('refuses an owned file replaced by a symlink to an outside file', () => {
		// A symlinked artifact could smuggle content from outside the tree into the snapshot, so the
		// read requires a regular file — a planted symlink under an owned name must fail naming it.
		const dir = tempDir();
		writeSnapshotFiles(dir, fixture());

		const name = ownedFileFor(dir, 'articles');
		const outsideDir = tempDir();
		const target = join(outsideDir, 'evil.json');
		writeFileSync(target, JSON.stringify({ collection: 'articles', fields: [], systemFields: [], relations: [] }));

		rmSync(join(dir, name), { force: true });
		symlinkSync(target, join(dir, name));

		const error = expectCliError(() => readSnapshotFiles(dir));

		expect(error.code).toBe('STATE');
		expect(error.message).toContain(name);
		expect(error.message).toMatch(/regular file/i);
	});

	it('refuses a renamed owned file whose name no longer identifies its collection', () => {
		// The filename is derived from the collection name; renaming the file (and its manifest entry)
		// breaks that identity, so the read must refuse rather than fold the collection in under a
		// foreign name — this also kills collision-duplication confusion.
		const dir = tempDir();
		writeSnapshotFiles(dir, fixture());

		const name = ownedFileFor(dir, 'articles');
		const renamed = `articles_${'0'.repeat(16)}.json`;
		renameSync(join(dir, name), join(dir, renamed));

		const metadataPath = join(dir, 'metadata.json');
		const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'));
		metadata.files = metadata.files.map((entry: string) => (entry === name ? renamed : entry));
		writeFileSync(metadataPath, JSON.stringify(metadata));

		const error = expectCliError(() => readSnapshotFiles(dir));

		expect(error.code).toBe('STATE');
		expect(error.message).toContain(renamed);
		expect(error.message).toContain('articles');
	});

	it('refuses a manifest that lists the same owned file twice', () => {
		// Duplicate ownership entries are corruption; folding one file in twice would double its
		// collection into the reassembled snapshot, so a repeated name must stop the read naming it.
		const dir = tempDir();
		writeSnapshotFiles(dir, fixture());

		const name = ownedFileFor(dir, 'articles');
		const metadataPath = join(dir, 'metadata.json');
		const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'));
		metadata.files.push(name);
		writeFileSync(metadataPath, JSON.stringify(metadata));

		const error = expectCliError(() => readSnapshotFiles(dir));

		expect(error.code).toBe('STATE');
		expect(error.message).toContain(name);
	});
});
