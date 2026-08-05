import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { type DataCollection, hasCommittedCollection, readDataFiles, writeDataFiles } from './data-store.js';
import { expectCliError } from './test-support.js';

const OWNED = /^[a-z0-9-]*_[0-9a-f]{16}\.json$/;

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

function committed(dir: string): NonNullable<ReturnType<typeof readDataFiles>> {
	const result = readDataFiles(dir);
	if (result === undefined) throw new Error(`no committed data in ${dir}`);
	return result;
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
	it('round-trips records and the source instance URL verbatim, sorted by primary key', () => {
		const dir = tempDir();
		writeDataFiles(dir, fixture(), SOURCE);

		const { collections: read, source } = committed(dir);

		expect(source).toBe(SOURCE);
		expect(read.map((collection) => collection.collection)).toEqual(['articles', 'directus_roles']);

		const roles = read.find((collection) => collection.collection === 'directus_roles');

		expect(roles?.records).toEqual([
			{ id: 'a', name: 'Admin', admin_access: true },
			{ id: 'b', name: 'Editor', meta: { nested: { order: [3, 1, 2] } } },
		]);
	});

	it('preserves committed files whose collection is outside the current write set', () => {
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

		const { collections: read } = committed(dir);

		expect(read.map((collection) => collection.collection)).toEqual(['articles', 'directus_flows', 'directus_roles']);
	});

	it('refuses to write over committed data from a different source instance', () => {
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

		expect(readFileSync(join(dir, articlesFile), 'utf8')).toContain('Ten');
		expect(committed(dir).source).toBe(SOURCE);
	});

	it('carries incomplete markers on preserved files and replaces them for fetched collections', () => {
		const dir = tempDir();

		const permissions: DataCollection = {
			collection: 'directus_permissions',
			primaryKey: 'id',
			records: [{ id: 1, policy: 'p1', collection: 'articles', action: 'read' }],
		};

		writeDataFiles(dir, [permissions, ...fixture()], SOURCE, ['directus_permissions']);

		const scoped = writeDataFiles(
			dir,
			[{ collection: 'directus_flows', primaryKey: 'id', records: [{ id: 'f1', name: 'Nightly' }] }],
			SOURCE,
		);

		expect(scoped.incomplete).toEqual(['directus_permissions']);
		expect(committed(dir).incomplete).toEqual(['directus_permissions']);

		const clean = writeDataFiles(dir, [permissions], SOURCE);

		expect(clean.incomplete).toEqual([]);
		expect(committed(dir).incomplete).toEqual([]);
	});

	it('sorts records by primary key as strings, so numeric-looking ids order lexically', () => {
		const dir = tempDir();

		writeDataFiles(
			dir,
			[{ collection: 'articles', primaryKey: 'id', records: [{ id: '10' }, { id: '9' }, { id: '100' }] }],
			SOURCE,
		);

		const { collections: read } = committed(dir);

		expect(read[0]?.records.map((record) => record['id'])).toEqual(['10', '100', '9']);
	});
});

describe('hasCommittedCollection', () => {
	it("answers from the committed manifest, tracking the writer's own file naming", () => {
		const dir = tempDir();
		expect(hasCommittedCollection(dir, 'directus_roles')).toBe(false);

		writeDataFiles(dir, fixture(), SOURCE);

		expect(hasCommittedCollection(dir, 'directus_roles')).toBe(true);
		expect(hasCommittedCollection(dir, 'directus_users')).toBe(false);
	});

	it('answers false, never throws, on a corrupt manifest — pull must stay able to heal it', () => {
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
			expect(error.message).not.toContain(source);
		}
	});

	it('refuses incomplete entries outside the verify-tracked set — they are interpolated into terminal output', () => {
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
		expect(committed(dir).incomplete).toEqual(['directus_permissions']);

		const clean = writeDataFiles(dir, [permissions], SOURCE);
		expect(clean.incomplete).toEqual([]);
	});

	it('fails loud, naming the file, when an owned file has a non-array "records"', () => {
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
