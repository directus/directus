import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
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

// An owned file is one this module writes and may delete: `${slug}_${hash}.json`. Ownership is
// recorded, not inferred from the name: metadata.json's `files` manifest lists exactly the
// collection files this store wrote, and only those are read or cleaned up. This regex never
// grants ownership on its own — a user's `notes_deadbeef.json` matches the shape yet is left
// untouched because it is absent from the manifest — it is only the deletion path's second
// guard, so a corrupted manifest can never delete anything outside our own naming shape.
const OWNED_FILE = /^[a-z0-9-]*_[0-9a-f]{8}\.json$/;

export interface WriteResult {
	readonly written: string[]; // filenames relative to dir, sorted
	readonly removed: string[]; // stale owned files deleted, sorted
}

interface CollectionFile {
	readonly collection: string;
	readonly definition: SnapshotEntry | null;
	readonly fields: SnapshotFieldEntry[];
	readonly systemFields: SnapshotFieldEntry[];
	readonly relations: SnapshotEntry[];
}

interface RawCollectionFile {
	readonly collection: string;
	readonly definition: unknown;
	readonly fields: readonly unknown[];
	readonly systemFields: readonly unknown[];
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

// `files` is the ownership manifest: the sorted collection filenames written this pull (never
// metadata.json itself). Since read and cleanup both key off it, provenance is recorded rather
// than guessed from the directory listing.
function header(
	snapshot: Snapshot,
	files: string[],
): { directus: string; files: string[]; vendor: string; version: number } {
	return { directus: snapshot.directus, files, vendor: snapshot.vendor, version: snapshot.version };
}

// Every collection name that appears anywhere in the snapshot gets one file grouping its
// definition and its fields, systemFields, and relations. The fields/systemFields split is
// server-side provenance the CLI cannot re-derive: systemFields carries indexed system-owned
// fields that live on ordinary collections (e.g. an `articles.id`), so a collection name never
// tells the two apart. Each array is filtered from its own snapshot bucket and never merged, so
// the split round-trips exactly as the server drew it.
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
			fields: snapshot.fields.filter((entry) => entry.collection === collection).sort(byField),
			systemFields: snapshot.systemFields.filter((entry) => entry.collection === collection).sort(byField),
			relations: snapshot.relations.filter((entry) => entry.collection === collection).sort(byRelation),
		});
	}

	return files;
}

// The previous write's ownership manifest, or an empty list when there is none to read yet.
// Used only by the write path's cleanup, which must tolerate a first pull or a pre-manifest
// directory: a missing, unreadable, or malformed metadata.json simply means nothing is known to
// be owned, so there is nothing to clean up rather than an error.
function readManifest(dir: string): string[] {
	const path = join(dir, METADATA_FILE);

	if (!existsSync(path)) return [];

	let parsed: unknown;

	try {
		parsed = JSON.parse(readFileSync(path, 'utf8'));
	} catch {
		return [];
	}

	if (!isPlainObject(parsed)) return [];

	const files = (parsed as Record<string, unknown>)['files'];

	if (!Array.isArray(files)) return [];

	return files.filter((name): name is string => typeof name === 'string');
}

export function writeSnapshotFiles(dir: string, snapshot: Snapshot): WriteResult {
	mkdirSync(dir, { recursive: true });

	// Read the previous manifest before touching anything: it is the only authority on what this
	// store owns and may clean up.
	const previous = readManifest(dir);

	// Write every collection file first, collecting the names this pull owns. Determinism makes an
	// unchanged file byte-identical, so a rewrite is invisible to git.
	const targets = new Set<string>();
	const files: string[] = [];

	for (const file of collectionFiles(snapshot)) {
		const name = fileName(file.collection);
		targets.add(name);
		files.push(name);
		writeFileAtomic(join(dir, name), serialize(file), 0o644);
	}

	// Stale cleanup: a pull mirrors the source, so an owned file left behind from a collection
	// that no longer exists would resurrect it on the next push. Delete exactly the previous
	// manifest's files this write did not re-emit; OWNED_FILE is a second guard so a corrupted
	// manifest can never delete anything outside our naming shape, and an unlisted foreign file is
	// never a candidate.
	const removed: string[] = [];

	for (const name of previous) {
		if (!targets.has(name) && OWNED_FILE.test(name)) {
			rmSync(join(dir, name), { force: true });
			removed.push(name);
		}
	}

	// Write metadata.json LAST: read refuses a directory without it, so it is the publish marker
	// for this pull. An interrupted first pull — collection files written, metadata not — reads
	// back as "no snapshot" rather than a plausible partial one, and its `files` manifest becomes
	// what the next read and the next cleanup treat as owned.
	files.sort(byCodepoint);
	writeFileAtomic(join(dir, METADATA_FILE), serialize(header(snapshot, files)), 0o644);

	return { written: [METADATA_FILE, ...files].sort(byCodepoint), removed: removed.sort(byCodepoint) };
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

// Read strictly: the write path always emits a string `collection` and all three arrays, so a
// missing or wrong-shaped key here is hand-editing, i.e. corruption, and must fail loud rather
// than coerce. Coercing a corrupted `"fields": {}` to `[]` would read the collection back as
// empty and let the next mirror push apply it as deleting every field. The fields/systemFields
// split is server-side provenance the read round-trips verbatim, so both arrays are required and
// checked. Entry contents stay verbatim so parseSnapshot names a bad entry downstream; the
// top-level `collection` stays authoritative for ordering, filenames, and cleanup only.
function readCollectionFile(dir: string, name: string): RawCollectionFile {
	const parsed = loadObject(join(dir, name), name);

	const collection = parsed['collection'];
	const fields = parsed['fields'];
	const systemFields = parsed['systemFields'];
	const relations = parsed['relations'];

	if (typeof collection !== 'string' || collection === '') {
		throw new CliError('STATE', `${name} is missing a valid "collection" name.`);
	}

	if (!Array.isArray(fields)) {
		throw new CliError('STATE', `${name} has a missing or non-array "fields".`);
	}

	if (!Array.isArray(systemFields)) {
		throw new CliError('STATE', `${name} has a missing or non-array "systemFields".`);
	}

	if (!Array.isArray(relations)) {
		throw new CliError('STATE', `${name} has a missing or non-array "relations".`);
	}

	return {
		collection,
		definition: parsed['definition'] ?? null,
		fields,
		systemFields,
		relations,
	};
}

export function readSnapshotFiles(dir: string): Snapshot {
	const metadataPath = join(dir, METADATA_FILE);

	if (!existsSync(dir) || !existsSync(metadataPath)) {
		throw new CliError('STATE', `No schema snapshot found in ${dir}.`, { hint: 'Run d6s sync pull first.' });
	}

	const metadata = loadObject(metadataPath, METADATA_FILE);

	// Membership is manifest-driven, never directory-driven: read exactly the files metadata.json
	// recorded. An unlisted file — even one matching the owned pattern — is not ours (e.g. a
	// user's `notes_deadbeef.json`) and is never read. A listed file that has since vanished is
	// corruption and must fail loud, naming it, not read back as an absent collection.
	const manifest = metadata['files'];

	if (!Array.isArray(manifest) || manifest.some((name) => typeof name !== 'string')) {
		throw new CliError('STATE', `${METADATA_FILE} is missing a valid "files" manifest.`);
	}

	const files: RawCollectionFile[] = [];

	for (const name of manifest as string[]) {
		if (!existsSync(join(dir, name))) {
			throw new CliError('STATE', `${METADATA_FILE} lists ${name}, but it is missing.`);
		}

		files.push(readCollectionFile(dir, name));
	}

	// Never trust manifest order for the reassembled arrays — sort by the authoritative internal
	// `collection` key so the result is deterministic regardless of how the manifest was ordered.
	files.sort((a, b) => byCodepoint(a.collection, b.collection));

	const collections: unknown[] = [];
	const fields: unknown[] = [];
	const systemFields: unknown[] = [];
	const relations: unknown[] = [];

	for (const file of files) {
		if (file.definition !== null) collections.push(file.definition);

		// Reassemble each array from its own bucket verbatim: the fields/systemFields split is
		// server provenance the CLI cannot re-derive from the collection name (systemFields holds
		// indexed system-owned fields on ordinary collections), so migrating an entry between the
		// two buckets would change how /schema/apply treats it.
		for (const entry of file.fields) fields.push(entry);
		for (const entry of file.systemFields) systemFields.push(entry);
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
