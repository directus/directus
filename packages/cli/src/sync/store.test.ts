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
import { expectCliError } from './test-support.js';

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

describe('writeSnapshotFiles / readSnapshotFiles', () => {
	it('round-trips a snapshot without losing unknown nested keys', () => {
		const dir = tempDir();
		const fx = fixture();

		writeSnapshotFiles(dir, fx);

		expect(readSnapshotFiles(dir)).toEqual(canonical(fx));
	});

	it('writes byte-identical files regardless of array order or key insertion order', () => {
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
		const dir = tempDir();
		writeSnapshotFiles(dir, fixture());

		const result = readSnapshotFiles(dir);
		const color = fieldEntry(fixture(), 'favorite_color');

		expect(result.systemFields).toContainEqual(color);
		expect(result.fields).not.toContainEqual(color);
	});

	it('round-trips an indexed system field on an ordinary collection through systemFields', () => {
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
		const dir = tempDir();
		const fx: Snapshot = { ...fixture(), foo: { bar: 1 } };

		writeSnapshotFiles(dir, fx);

		const metadata = JSON.parse(readFileSync(join(dir, 'metadata.json'), 'utf8'));
		expect(metadata.snapshot.foo).toEqual({ bar: 1 });
		expect(metadata.foo).toBeUndefined();

		expect(readSnapshotFiles(dir)['foo']).toEqual({ bar: 1 });
	});

	it('treats absent metadata as a first pull but refuses a corrupt one on the next write', () => {
		const dir = tempDir();

		writeSnapshotFiles(dir, fixture());

		writeFileSync(join(dir, 'metadata.json'), '{ not valid json');

		const error = expectCliError(() => writeSnapshotFiles(dir, fixture()));

		expect(error.code).toBe('STATE');
		expect(error.message).toContain('metadata.json');
	});

	it('refuses to write over a symlinked metadata.json', () => {
		const dir = tempDir();
		writeSnapshotFiles(dir, fixture());

		const outsideDir = tempDir();
		const target = join(outsideDir, 'metadata.json');
		writeFileSync(target, readFileSync(join(dir, 'metadata.json'), 'utf8'));

		rmSync(join(dir, 'metadata.json'), { force: true });
		symlinkSync(target, join(dir, 'metadata.json'));

		const error = expectCliError(() => writeSnapshotFiles(dir, fixture()));

		expect(error.code).toBe('STATE');
		expect(error.message).toContain('metadata.json');
		expect(error.message).toMatch(/regular file/i);
	});

	it('preserves out-of-scope artifacts and reads the full set after a scoped refresh', () => {
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

		const read = readSnapshotFiles(dir);
		expect(read.collections.map((entry) => entry.collection).sort()).toEqual(['a', 'b', 'c']);

		expect(
			read.fields
				.filter((entry) => entry.collection === 'b')
				.map((entry) => entry.field)
				.sort(),
		).toEqual(['body', 'title']);

		expect(read.version).toBe(1);
	});

	it('removes an in-scope collection absent from the response but preserves out-of-scope files', () => {
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

	it('refuses a scoped write over a listed-but-missing file — local damage must not become remote deletion', () => {
		const dir = tempDir();
		writeSnapshotFiles(dir, abc());

		const bFile = ownedFileFor(dir, 'b');
		rmSync(join(dir, bFile), { force: true });
		const before = readAll(dir);

		const scopedA: Snapshot = {
			version: 2,
			directus: '11.5.0',
			vendor: 'postgres',
			collections: [{ collection: 'a' }],
			fields: [{ collection: 'a', field: 'changed-before-refusal', type: 'string' }],
			systemFields: [],
			relations: [],
		};

		let error: unknown;

		try {
			writeSnapshotFiles(dir, scopedA, { inScope: (name) => name === 'a' });
		} catch (caught) {
			error = caught;
		}

		expect(error).toBeInstanceOf(CliError);
		expect((error as CliError).message).toContain(bFile);
		expect((error as CliError).hint).toContain('full pull');
		expect(readAll(dir)).toEqual(before);

		const healed = writeSnapshotFiles(dir, abc());
		expect(healed.written).toContain(bFile);

		expect(
			readSnapshotFiles(dir)
				.collections.map((entry) => entry.collection)
				.sort(),
		).toEqual(['a', 'b', 'c']);
	});
});

describe('readSnapshotFiles failures', () => {
	it('reports the pull-first recovery for absent and empty directories', () => {
		const error = expectCliError(() => readSnapshotFiles(join(tmpdir(), 'd6s-store-absent-xyz')));

		expect(error.code).toBe('STATE');
		expect(error.hint).toBe('Run d6s sync pull first.');

		const emptyError = expectCliError(() => readSnapshotFiles(tempDir()));

		expect(emptyError.code).toBe('STATE');
		expect(emptyError.hint).toBe('Run d6s sync pull first.');
	});

	it('fails loud, naming the drifted field, when an owned file is hand-corrupted', () => {
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

	it('fails loud, naming the file and the key, when an owned entry array is not an array', () => {
		for (const key of ['fields', 'systemFields', 'relations']) {
			const dir = tempDir();
			writeSnapshotFiles(dir, fixture());

			const name = ownedFileFor(dir, 'articles');
			const parsed = JSON.parse(readFileSync(join(dir, name), 'utf8'));
			parsed[key] = {};
			writeFileSync(join(dir, name), JSON.stringify(parsed));

			const error = expectCliError(() => readSnapshotFiles(dir));

			expect(error.code).toBe('STATE');
			expect(error.message).toContain(name);
			expect(error.message).toContain(key);
		}
	});

	it('fails loud, naming the file, when the manifest lists a collection file that is gone', () => {
		const dir = tempDir();
		writeSnapshotFiles(dir, fixture());

		const name = ownedFileFor(dir, 'articles');
		rmSync(join(dir, name), { force: true });

		const error = expectCliError(() => readSnapshotFiles(dir));

		expect(error.code).toBe('STATE');
		expect(error.message).toContain(name);
	});

	it('refuses a manifest entry that escapes the schema directory and never reads the outside file', () => {
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

	it('refuses a metadata.json replaced by a symlink to an outside file', () => {
		const dir = tempDir();
		writeSnapshotFiles(dir, fixture());

		const outsideDir = tempDir();
		const target = join(outsideDir, 'metadata.json');
		writeFileSync(target, readFileSync(join(dir, 'metadata.json'), 'utf8'));

		rmSync(join(dir, 'metadata.json'), { force: true });
		symlinkSync(target, join(dir, 'metadata.json'));

		const error = expectCliError(() => readSnapshotFiles(dir));

		expect(error.code).toBe('STATE');
		expect(error.message).toContain('metadata.json');
		expect(error.message).toMatch(/regular file/i);
	});

	it('refuses a renamed owned file whose name no longer identifies its collection', () => {
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
