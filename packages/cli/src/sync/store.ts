import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { isPlainObject } from 'lodash-es';
import { CliError } from '../kernel/error.js';
import { writeFileAtomic } from '../kernel/write.js';
import { parseSnapshot, type Snapshot, type SnapshotEntry, type SnapshotFieldEntry } from './contract.js';

// The schema snapshot on disk as committable artifacts: one header file plus one file per
// collection, serialized so the same schema always produces identical bytes on any
// machine. That byte-determinism is the module's contract — it lets git show real schema
// changes and nothing else, and lets a hand-edited artifact fail loud on read.

const METADATA_FILE = 'metadata.json';

// Directus reserves the `directus_` name prefix for system collections. That prefix rule has
// exactly one home: readSnapshotFiles buckets each field entry by its own `collection`. The
// write path never splits on the prefix — it groups a collection's fields from both buckets —
// so an entry misplaced upstream round-trips into its correct bucket instead of being dropped.
const SYSTEM_PREFIX = 'directus_';

// An owned file is one this module writes and may delete: `${slug}_${hash}.json`. Anything
// else in the directory (user files, metadata.json, unrelated json) is never touched by
// cleanup and is ignored on read.
const OWNED_FILE = /^[a-z0-9-]*_[0-9a-f]{8}\.json$/;

export interface WriteResult {
	readonly written: string[]; // filenames relative to dir, sorted
	readonly removed: string[]; // stale owned files deleted, sorted
}

interface CollectionFile {
	readonly collection: string;
	readonly definition: SnapshotEntry | null;
	readonly fields: SnapshotFieldEntry[];
	readonly relations: SnapshotEntry[];
}

interface RawCollectionFile {
	readonly collection: string;
	readonly definition: unknown;
	readonly fields: readonly unknown[];
	readonly relations: readonly unknown[];
}

// Codepoint comparison, never localeCompare/Intl: locale ordering varies by machine and
// would make the committed bytes non-deterministic across contributors and CI. Written as
// statements rather than a nested ternary to satisfy the repo's no-nested-ternary rule.
function byCodepoint(a: string, b: string): number {
	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
}

function asString(value: unknown): string {
	return typeof value === 'string' ? value : '';
}

function byField(a: SnapshotFieldEntry, b: SnapshotFieldEntry): number {
	return byCodepoint(a.field, b.field);
}

function byRelation(a: SnapshotEntry, b: SnapshotEntry): number {
	return (
		byCodepoint(asString(a['field']), asString(b['field'])) ||
		byCodepoint(asString(a['related_collection']), asString(b['related_collection']))
	);
}

// Canonical form: object keys sorted at every depth, array order preserved as data.
// Combined with tab indent, LF newlines, and a single trailing newline this yields the
// same bytes for the same schema regardless of key insertion order or how the snapshot's
// top-level arrays were ordered upstream.
function canonicalize(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(canonicalize);

	if (isPlainObject(value)) {
		const record = value as Record<string, unknown>;

		// Build via Object.fromEntries, never `result[key] = ...`: a legal field or option named
		// `__proto__` would otherwise hit the prototype setter and vanish from the artifact.
		return Object.fromEntries(
			Object.keys(record)
				.sort(byCodepoint)
				.map((key): [string, unknown] => [key, canonicalize(record[key])]),
		);
	}

	return value;
}

function serialize(value: unknown): string {
	return `${JSON.stringify(canonicalize(value), null, '\t')}\n`;
}

// The slug is display-only: it collides across case-variant and punctuation-variant names,
// so the sha256-derived hash (taken over the exact name, not the slug) disambiguates them.
// The `collection` key inside the file stays authoritative.
function fileName(collection: string): string {
	const slug = collection
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

	const hash = createHash('sha256').update(collection).digest('hex').slice(0, 8);
	return `${slug}_${hash}.json`;
}

function header(snapshot: Snapshot): { directus: string; vendor: string; version: number } {
	return { directus: snapshot.directus, vendor: snapshot.vendor, version: snapshot.version };
}

// Every collection name that appears anywhere in the snapshot gets a file grouping its
// definition, fields, and relations. A collection's fields are drawn from both buckets so an
// entry misplaced upstream is never dropped; the read side re-buckets by the `directus_` prefix.
function collectionFiles(snapshot: Snapshot): CollectionFile[] {
	const names = new Set<string>();
	for (const entry of snapshot.collections) names.add(entry.collection);
	for (const entry of snapshot.fields) names.add(entry.collection);
	for (const entry of snapshot.systemFields) names.add(entry.collection);
	for (const entry of snapshot.relations) names.add(entry.collection);

	const files: CollectionFile[] = [];

	for (const collection of names) {
		files.push({
			collection,
			definition: snapshot.collections.find((entry) => entry.collection === collection) ?? null,
			fields: [...snapshot.fields, ...snapshot.systemFields]
				.filter((entry) => entry.collection === collection)
				.sort(byField),
			relations: snapshot.relations.filter((entry) => entry.collection === collection).sort(byRelation),
		});
	}

	return files;
}

export function writeSnapshotFiles(dir: string, snapshot: Snapshot): WriteResult {
	mkdirSync(dir, { recursive: true });

	// Always rewrite every file; determinism makes an unchanged file byte-identical, so a
	// rewrite is invisible to git.
	const written = [METADATA_FILE];
	writeFileAtomic(join(dir, METADATA_FILE), serialize(header(snapshot)), 0o644);

	const targets = new Set<string>();

	for (const file of collectionFiles(snapshot)) {
		const name = fileName(file.collection);
		targets.add(name);
		written.push(name);
		writeFileAtomic(join(dir, name), serialize(file), 0o644);
	}

	// Stale cleanup: a pull mirrors the source, so an owned file left behind from a
	// collection that no longer exists would resurrect that collection on the next push.
	// Only owned files absent from the target set are removed; nothing else is touched.
	const removed: string[] = [];

	for (const entry of readdirSync(dir)) {
		if (OWNED_FILE.test(entry) && !targets.has(entry)) {
			rmSync(join(dir, entry), { force: true });
			removed.push(entry);
		}
	}

	return { written: written.sort(byCodepoint), removed: removed.sort(byCodepoint) };
}

function loadObject(path: string, name: string): Record<string, unknown> {
	let raw: string;

	try {
		raw = readFileSync(path, 'utf8');
	} catch {
		throw new CliError('STATE', `Cannot read ${name}.`);
	}

	let parsed: unknown;

	try {
		parsed = JSON.parse(raw);
	} catch {
		throw new CliError('STATE', `${name} is not valid JSON.`);
	}

	if (!isPlainObject(parsed)) throw new CliError('STATE', `${name} is not a schema file.`);

	return parsed as Record<string, unknown>;
}

// Read strictly: the write path always emits a string `collection` and both arrays, so a
// missing or wrong-shaped key here is hand-editing, i.e. corruption, and must fail loud rather
// than coerce. Coercing a corrupted `"fields": {}` to `[]` would read the collection back as
// empty and let the next mirror push apply it as deleting every field. Entry contents stay
// verbatim so parseSnapshot names a bad entry downstream; the top-level `collection` stays
// authoritative for ordering, filenames, and cleanup only — never for bucketing fields.
function readCollectionFile(dir: string, name: string): RawCollectionFile {
	const parsed = loadObject(join(dir, name), name);

	const collection = parsed['collection'];
	const fields = parsed['fields'];
	const relations = parsed['relations'];

	if (typeof collection !== 'string' || collection === '') {
		throw new CliError('STATE', `${name} is missing a valid "collection" name.`);
	}

	if (!Array.isArray(fields)) {
		throw new CliError('STATE', `${name} has a missing or non-array "fields".`);
	}

	if (!Array.isArray(relations)) {
		throw new CliError('STATE', `${name} has a missing or non-array "relations".`);
	}

	return {
		collection,
		definition: parsed['definition'] ?? null,
		fields,
		relations,
	};
}

// The single home of the `directus_` prefix rule. A field entry is system-owned iff its own
// `collection` is a `directus_` name, so an entry misplaced by a bad edit or merge is re-homed
// by its own value rather than trusted from the file's top-level key. A malformed entry (not an
// object, or no string `collection`) falls to `fields`, where parseSnapshot fails loud naming it.
function isSystemField(entry: unknown): boolean {
	if (!isPlainObject(entry)) return false;

	const collection = (entry as Record<string, unknown>)['collection'];

	return typeof collection === 'string' && collection.startsWith(SYSTEM_PREFIX);
}

export function readSnapshotFiles(dir: string): Snapshot {
	const metadataPath = join(dir, METADATA_FILE);

	if (!existsSync(dir) || !existsSync(metadataPath)) {
		throw new CliError('STATE', `No schema snapshot found in ${dir}.`, { hint: 'Run d6s sync pull first.' });
	}

	const metadata = loadObject(metadataPath, METADATA_FILE);

	const files: RawCollectionFile[] = [];

	for (const entry of readdirSync(dir)) {
		if (OWNED_FILE.test(entry)) files.push(readCollectionFile(dir, entry));
	}

	// Never trust readdir order — sort by the authoritative internal `collection` key so
	// the reassembled arrays are deterministic regardless of filesystem enumeration.
	files.sort((a, b) => byCodepoint(a.collection, b.collection));

	const collections: unknown[] = [];
	const fields: unknown[] = [];
	const systemFields: unknown[] = [];
	const relations: unknown[] = [];

	for (const file of files) {
		if (file.definition !== null) collections.push(file.definition);

		// Bucket each field by its own `collection`, not the file's key: a hand-edit or merge that
		// leaves an entry disagreeing with the file must be re-homed, since /schema/apply treats
		// the two buckets differently. The file's `collection` still ordered and named this file.
		for (const entry of file.fields) (isSystemField(entry) ? systemFields : fields).push(entry);
		for (const entry of file.relations) relations.push(entry);
	}

	const assembled = {
		version: metadata['version'],
		directus: metadata['directus'],
		vendor: metadata['vendor'],
		collections,
		fields,
		systemFields,
		relations,
	};

	try {
		return parseSnapshot(assembled);
	} catch (error) {
		// These files are hand-editable on disk, so a drift here is corrupted local state,
		// not an HTTP protocol break — rethrow under STATE while keeping the field-level
		// detail that names what drifted.
		if (error instanceof CliError) {
			throw new CliError(
				'STATE',
				`Schema files in ${dir} do not form a valid snapshot.`,
				error.detail === undefined ? {} : { detail: error.detail },
			);
		}

		throw error;
	}
}
